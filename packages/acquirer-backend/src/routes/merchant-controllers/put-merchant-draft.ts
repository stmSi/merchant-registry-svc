/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express'
import { QueryFailedError } from 'typeorm'
import * as z from 'zod'
import { AppDataSource } from '../../database/data-source'
import { MerchantEntity } from '../../entity/MerchantEntity'
import logger from '../../logger'
import { CheckoutCounterEntity } from '../../entity/CheckoutCounterEntity'
import { BusinessLicenseEntity } from '../../entity/BusinessLicenseEntity'
import { PortalUserEntity } from '../../entity/PortalUserEntity'
import {
  MerchantAllowBlockStatus,
  MerchantRegistrationStatus
} from 'shared-lib'

import {
  MerchantSubmitDataSchema
} from '../schemas'
import { uploadMerchantDocument } from '../../middleware/minioClient'

/**
 * @openapi
 * /merchants/{id}/draft:
 *   put:
 *     tags:
 *       - Merchants
 *     security:
 *       - Authorization: []
 *     parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: number
 *        required: true
 *        description: Numeric ID of the Merchant Record
 *     summary: Update Merchant Draft
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               dba_trading_name:
 *                 type: string
 *                 example: "Merchant 1"
 *               registered_name:
 *                 type: string
 *                 example: "Merchant 1"
 *               employees_num:
 *                 type: string
 *                 example: "1 - 5"
 *               monthly_turnover:
 *                 type: number
 *                 example: 0.5
 *               currency_code:
 *                 type: string
 *                 example: "PHP"
 *               category_code:
 *                 type: string
 *                 example: "10410"
 *               merchant_type:
 *                 type: string
 *                 example: "Individual"
 *               payinto_alias:
 *                 type: string
 *                 example: "merchant1"
 *                 required: false
 *               registration_status:
 *                 type: string
 *                 example: "Draft"
 *               registration_status_reason:
 *                 type: string
 *                 example: "Drafted by Maker"
 *               license_number:
 *                 type: string
 *                 example: "123456789"
 *                 required: true
 *
 *               license_document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description:
 *          The merchant draft has been created successfully.
 *         content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: "Drafting Merchant Successful."
 *                data:
 *                  type: object
 *
 *       422:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
// TODO: Protect the route with User Authentication (Keycloak)
// TODO: check if the authenticated user is a Maker
export async function putMerchantDraft (req: Request, res: Response) {
  // TODO: Remove This! and replace with Keycloak Authentication
  const token = req.headers.authorization === undefined
    ? undefined
    : req.headers.authorization.replace('Bearer', '').trim()
  logger.info('Token: %s', token)
  let portalUser = null
  if (token === process.env.TEST1_DUMMY_AUTH_TOKEN) {
    portalUser = await AppDataSource.manager.findOne(
      PortalUserEntity,
      { where: { email: process.env.TEST1_EMAIL } }
    )
  } else if (token === process.env.TEST2_DUMMY_AUTH_TOKEN) {
    portalUser = await AppDataSource.manager.findOne(
      PortalUserEntity,
      { where: { email: process.env.TEST2_EMAIL } }
    )
  } else {
    return res.status(401).send({ message: 'Unauthorized' })
  }

  try {
    MerchantSubmitDataSchema.parse(req.body)
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.error('Validation error: %o', err.issues.map((issue) => issue.message))
      return res.status(422).send({ error: err })
    }
  }

  // Merchant ID validation
  const id = Number(req.params.id)
  if (isNaN(id)) {
    logger.error('Invalid ID')
    res.status(422).send({ message: 'Invalid ID' })
    return
  }

  const merchantRepository = AppDataSource.getRepository(MerchantEntity)
  const merchant = await merchantRepository.findOne({
    where: { id },
    relations: ['checkout_counters', 'business_licenses']
  })
  if (merchant === null) {
    return res.status(422).send({ error: 'Merchant ID does not exist' })
  }
  if (merchant.registration_status !== MerchantRegistrationStatus.DRAFT) {
    return res.status(422).send({
      error: `Merchant is not in Draft Status. Current Status: ${merchant.registration_status}`
    })
  }

  logger.debug('Updating Merchant: %o', merchant.id)

  // Checkout Counter Update
  const alias: string = req.body.payinto_alias
  let checkoutCounter = null
  if (merchant?.checkout_counters?.length === 1) {
    checkoutCounter = merchant.checkout_counters[0]
    logger.debug('Updating checkout counter: %o', checkoutCounter)
  }

  if (checkoutCounter === null) {
    checkoutCounter = new CheckoutCounterEntity()
    logger.debug('Creating new checkout counter: %o', checkoutCounter)
  }

  if (checkoutCounter?.alias_value !== alias) {
    const isExists = await AppDataSource.manager.exists(
      CheckoutCounterEntity,
      { where: { alias_value: alias } }
    )
    if (isExists) {
      const errorMsg = `PayInto Alias Value already exists: ${alias}`
      logger.error(errorMsg)
      return res.status(422).send({ error: errorMsg })
    } else {
      // Update PayInto Alias Value
      checkoutCounter.alias_value = alias
      try {
        await AppDataSource.manager.save(checkoutCounter)
      } catch (err) {
        if (err instanceof QueryFailedError) {
          logger.error('Query failed: %o', err.message)
          return res.status(500).send({ error: err.message })
        }
      }
    }
  }

  merchant.dba_trading_name = req.body.dba_trading_name
  merchant.registered_name = req.body.registered_name // TODO: check if already registered
  merchant.employees_num = req.body.employees_num
  merchant.monthly_turnover = req.body.monthly_turnover
  merchant.currency_code = req.body.currency_code
  merchant.category_code = req.body.category_code
  merchant.merchant_type = req.body.merchant_type
  merchant.registration_status = req.body.registration_status
  merchant.registration_status_reason = req.body.registration_status_reason
  merchant.allow_block_status = MerchantAllowBlockStatus.PENDING

  if (portalUser !== null) { // Should never be null.. but just in case
    merchant.created_by = portalUser
  }
  if (checkoutCounter !== null) {
    merchant.checkout_counters = [checkoutCounter]
  }

  try {
    await merchantRepository.save(merchant)

    // Update License Data
    const file = req.file
    const licenseNumber = req.body.license_number
    const licenseRepository = AppDataSource.getRepository(BusinessLicenseEntity)
    let license: BusinessLicenseEntity | null = merchant.business_licenses[0] ?? null

    if (license === null) {
      license = new BusinessLicenseEntity()
    }

    license.license_number = licenseNumber
    license.merchant = merchant

    if (file != null) {
      const documentPath = await uploadMerchantDocument(merchant, licenseNumber, file)
      if (documentPath == null) {
        logger.error('Failed to upload the PDF to Storage Server')
      } else {
        logger.debug('Successfully uploaded the PDF \'%s\' to Storage', documentPath)
        // Save the file info to the database
        license.license_document_link = documentPath
        await licenseRepository.save(license)
        merchant.business_licenses = [license]
        await merchantRepository.save(merchant)
      }
    } else {
      logger.debug('No PDF file submitted for the merchant')
    }
  } catch (err) {
    // Revert the checkout counter creation
    if (checkoutCounter !== null) {
      await AppDataSource.manager.delete(CheckoutCounterEntity, checkoutCounter.id)
    }

    if (err instanceof QueryFailedError) {
      logger.error('Query Failed: %o', err.message)
      return res.status(500).send({ error: err.message })
    }
    logger.error('Error: %o', err)
    return res.status(500).send({ error: err })
  }

  // Remove created_by from the response to prevent password hash leaking
  const merchantData = {
    ...merchant,
    created_by: undefined,

    // Fix TypeError: Converting circular structure to JSON
    business_licenses: merchant.business_licenses?.map(license => {
      const { merchant, ...licenseData } = license
      return licenseData
    })
  }
  return res.status(201).send({ message: 'Updating Merchant Draft Successful', data: merchantData })
}
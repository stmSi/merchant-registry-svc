/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express'
import { AppDataSource } from '../../database/data-source'
import { MerchantEntity } from '../../entity/MerchantEntity'
import logger from '../../logger'
import { MerchantRegistrationStatus, AuditActionType, AuditTrasactionStatus } from 'shared-lib'
import { getAuthenticatedPortalUser } from '../../middleware/authenticate'
import { In, Not } from 'typeorm'
import { audit } from '../../utils/audit'

/**
 * @openapi
 * /merchants/bulk-approve:
 *   put:
 *     tags:
 *       - Merchants
 *       - Merchant Status
 *     security:
 *       - Authorization: []
 *     summary: Bulk Approve the registration status of multiple Merchant Records
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: List of Merchant Record IDs to be updated
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Status Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

export async function putBulkWaitingAliasGeneration (req: Request, res: Response) {
  const portalUser = await getAuthenticatedPortalUser(req.headers.authorization)
  if (portalUser == null) {
    return res.status(401).send({ message: 'Unauthorized' })
  }

  const ids: number[] = req.body.ids
  const merchantRepository = AppDataSource.getRepository(MerchantEntity)

  // Validate IDs
  if (!Array.isArray(ids)) throw new Error('IDs must be an array of numbers.')
  for (const id of ids) {
    if (isNaN(Number(id)) || Number(id) < 1) {
      await audit(
        AuditActionType.UPDATE,
        AuditTrasactionStatus.FAILURE,
        'putBulkApprove',
        'ID must be a valid ID number',
        'Merchant',
        {}, {}, portalUser
      )

      return res.status(422).send({ message: 'Each ID in the array must be a valid ID number.' })
    }
  }

  const count = await merchantRepository.count({
    where: {
      id: In(ids),
      registration_status: MerchantRegistrationStatus.REVIEW,
      created_by: Not(portalUser.id)
    }
  })

  if (count !== ids.length) {
    await audit(
      AuditActionType.UPDATE,
      AuditTrasactionStatus.FAILURE,
      'putBulkApprove',
      'IDs must be valid and have a status of "Review". and not created by you',
      'Merchant',
      {}, { ids: req.body.ids }, portalUser
    )
    return res.status(422).send({
      message: 'All IDs must be valid and have a status of "Review". and not created by you'
    })
  }

  try {
    await merchantRepository
      .createQueryBuilder()
      .update(MerchantEntity)
      .set({
        registration_status: MerchantRegistrationStatus.WAITINGALIASGENERATION,
        registration_status_reason: 'Bulk Updated to Waiting Alias Generation',
        checked_by: portalUser
      })
      .whereInIds(ids)
      .execute()

    await audit(
      AuditActionType.UPDATE,
      AuditTrasactionStatus.SUCCESS,
      'putBulkApprove',
      'Status Updated to Waiting Alias Generation',
      'Merchant',
      {}, {}, portalUser
    )
    res.status(200).send({
      message: 'WAITINGALIASGENERATION Status Updated for multiple merchants'
    })
  } catch (e) {
    logger.error(e)
    await audit(
      AuditActionType.UPDATE,
      AuditTrasactionStatus.FAILURE,
      'putBulkApprove',
      'Status Update Failed',
      'Merchant',
      {}, {}, portalUser
    )
    res.status(500).send({ message: e })
  }
}
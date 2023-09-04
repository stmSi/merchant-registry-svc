import path from 'path'
import bcrypt from 'bcrypt'
import { type Request, type Response } from 'express'
import * as z from 'zod'
import dotenv from 'dotenv'
import { AppDataSource } from '../../database/data-source'
import { PortalUserEntity } from '../../entity/PortalUserEntity'
import logger from '../../services/logger'
import jwt from 'jsonwebtoken'
import { audit } from '../../utils/audit'
import { AuditActionType, AuditTrasactionStatus } from 'shared-lib'

export const LoginFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8)
})

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true })
}

export const JWT_SECRET = process.env.JWT_SECRET ?? ''
/**
 * @openapi
 * /users/login:
 *   post:
 *     tags:
 *       - Portal Users
 *     summary: Authenticate a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test1@email.com"
 *                 description: "The email for login"
 *               password:
 *                 type: string
 *                 example: "password"
 *                 description: "The password for login in clear text"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *       422:
 *         description: Validation error
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 *
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export async function postUserLogin (req: Request, res: Response) {
  try {
    LoginFormSchema.parse(req.body)
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.debug('Validation error: %o', err)
      return res.status(422).send({ message: 'Invalid credentials' })
    }
  }

  try {
    const user = await AppDataSource.manager.findOne(
      PortalUserEntity,
      {
        where: { email: req.body.email }
      }
    )
    logger.info('User %s login attempt.', req.body.email)

    if (user == null) {
      throw new Error('Invalid credentials')
    }

    const passwordMatch = await bcrypt.compare(req.body.password, user.password)
    if (!passwordMatch) {
      throw new Error('Invalid credentials')
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' })
    logger.info('User %s logged in successfully.', user.email)
    await audit(
      AuditActionType.ACCESS,
      AuditTrasactionStatus.SUCCESS,
      'postUserLogin',
      'User login successful',
      'PortalUserEntity',
      {}, {}, null
    )

    res.json({ success: true, mesaage: 'Login successful', token })
  } catch (error) {
    await audit(
      AuditActionType.ACCESS,
      AuditTrasactionStatus.FAILURE,
      'postUserLogin',
      'User login failed',
      'PortalUserEntity',
      {}, {}, null
    )

    logger.error('User %s login failed: %o', req.body.email, error)
    res
      .status(400)
      .send({ success: false, message: 'Invalid credentials' })
  }
}
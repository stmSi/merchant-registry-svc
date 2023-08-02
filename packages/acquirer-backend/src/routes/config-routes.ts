
import express, { type Request, type Response } from 'express'
import logger from '../logger'

/**
 * @openapi
 * /config/trace-level:
 *   put:
 *     tags:
 *       - Server Configuration
 *     summary: Set the log level
 *     description: This endpoint allows you to set the logging level
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level:
 *                 type: string
 *                 description: The registration status of the merchant
 *                 enum: [error, warn, info, http, verbose, debug, silly]
 *                 example: "error"
 *     responses:
 *       200:
 *         description: Log level set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid log level
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid log level: error"
 */
const router = express.Router()
router.put('/config/trace-level', (req: Request, res: Response) => {
  const level: string = req.body.level

  if (
    ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'].includes(level)
  ) {
    logger.level = level
    logger.info(`New Log Level set: ${level}`)
    return res.send({ message: 'Log level set successfully' })
  } else {
    return res.status(400).send({ message: `Invalid log level: ${level}` })
  }
})

export default router

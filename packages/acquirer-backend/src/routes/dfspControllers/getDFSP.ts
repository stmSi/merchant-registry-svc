/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Response } from 'express'
import { AppDataSource } from '../../database/dataSource'
import logger from '../../services/logger'
import { type AuthRequest } from 'src/types/express'
import { DFSPEntity } from '../../entity/DFSPEntity'

/**
 * @openapi
 * tags:
 *   name: DFSP
 *
 * /dfsps:
 *   get:
 *     tags:
 *       - DFSP
 *     security:
 *       - Authorization: []
 *     summary: GET DFSP
 *     responses:
 *       200:
 *         description: GET Roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The response message
 *                   example: OK
 *                 data:
 *                   type: array
 *                   description: The response data
 *                   items:
 *                     type: object
 */
export async function getDFSPs (req: AuthRequest, res: Response) {
  const portalUser = req.user
  if (portalUser == null) {
    return res.status(401).send({ message: 'Unauthorized' })
  }

  try {
    logger.debug('req.query: %o', req.query)

    const DFSPRepository = AppDataSource.getRepository(DFSPEntity)

    const dfsps = await DFSPRepository.find()

    res.send({ message: 'OK', data: dfsps })
  } catch (e) {
    logger.error(e)
    res.status(500).send({ message: e })
  }
}
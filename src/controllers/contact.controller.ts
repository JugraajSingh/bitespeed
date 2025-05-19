import { identifyContact } from '../services/contact.service';
import { validateIdentifyRequest } from '../utils/validation.util';
import { formatResponse } from '../utils/response.util';
import { Request, Response } from 'express';

export const identifyContactHandler = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = validateIdentifyRequest(req.body);
    const contact = await identifyContact(email, phoneNumber);
    res.status(200).json(formatResponse(contact));
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Unknown error occurred' });
    }
  }
};

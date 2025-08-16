import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, email, message } = req.body;
    // In a real application, you'd send the message to a service or store it
    console.log('Contact form submission:', { name, email, message });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

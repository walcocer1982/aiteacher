// HTTP

import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';

const chatService = new ChatService();

export async function createSession(req: Request, res: Response) {
  try {
    const { lessonId, userId } = req.body;
    
    if (!lessonId || !userId) {
      return res.status(400).json({ error: 'lessonId and userId are required' });
    }

    const result = await chatService.createSession(lessonId, userId);
    res.json(result);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleEvent(req: Request, res: Response) {
  try {
    const { sessionId, event } = req.body;
    
    if (!sessionId || !event) {
      return res.status(400).json({ error: 'sessionId and event are required' });
    }

    const result = await chatService.handleEvent(sessionId, event);
    res.json(result);
  } catch (error) {
    console.error('Error handling event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const session = await chatService.getSession(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

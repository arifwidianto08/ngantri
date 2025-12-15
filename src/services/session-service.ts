/**
 * Session service interface and implementation
 * Handles business logic for buyer session operations
 */

import { SessionRepository } from "../data/interfaces/session-repository";
import { BuyerSession, NewBuyerSession } from "../data/schema";
import { AppError, errors } from "../lib/errors";

// Service-specific types
export interface CreateSessionData {
  tableNumber?: number;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  averageSessionDuration: number;
  sessionsToday: number;
}

/**
 * Session service interface
 */
export interface ISessionService {
  // Session operations
  createSession(data?: CreateSessionData): Promise<BuyerSession>;
  findSessionById(id: string): Promise<BuyerSession>;
  deleteSession(id: string): Promise<void>;

  // Session management
  updateTableNumber(id: string, tableNumber: number): Promise<BuyerSession>;
  getActiveSessionsCount(): Promise<number>;

  // Analytics
  getSessionStats(startDate?: Date, endDate?: Date): Promise<SessionStats>;

  // Validation methods
  validateSessionData(data: CreateSessionData): Promise<void>;
}

/**
 * Session service implementation
 */
export class SessionService implements ISessionService {
  constructor(private sessionRepository: SessionRepository) {}

  /**
   * Create a new buyer session
   */
  async createSession(data: CreateSessionData = {}): Promise<BuyerSession> {
    // Validate session data
    await this.validateSessionData(data);

    const sessionData: NewBuyerSession = {
      tableNumber: data.tableNumber || null,
    };

    try {
      const session = await this.sessionRepository.createSession(sessionData);
      return session;
    } catch (error) {
      throw errors.internal("Failed to create session", error);
    }
  }

  /**
   * Find session by ID
   */
  async findSessionById(id: string): Promise<BuyerSession> {
    try {
      const session = await this.sessionRepository.findSessionById(id);
      if (!session) {
        throw errors.notFound("Session", id);
      }
      return session;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to find session", error);
    }
  }

  /**
   * Find session by ID or create if doesn't exist
   */
  async findOrCreateSession(id: string): Promise<BuyerSession> {
    try {
      const session = await this.sessionRepository.findSessionById(id);
      if (session) {
        return session;
      }
      // Create new session with the provided ID
      const newSession: NewBuyerSession = {
        id: id, // Allow specifying the ID
      };
      return await this.sessionRepository.createSession(newSession);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to find or create session", error);
    }
  }

  /**
   * Delete session (soft delete)
   */
  async deleteSession(id: string): Promise<void> {
    // Validate session exists
    await this.findSessionById(id);

    try {
      const result = await this.sessionRepository.softDeleteSession(id);
      if (!result) {
        throw errors.internal("Failed to delete session");
      }
    } catch (error) {
      throw errors.internal("Failed to delete session", error);
    }
  }

  /**
   * Update table number for a session
   * Only updates existing sessions (session should be created first via findOrCreateSession)
   */
  async updateTableNumber(
    id: string,
    tableNumber: number
  ): Promise<BuyerSession> {
    // Validate table number
    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
      throw errors.validation("Table number must be a positive integer");
    }

    if (tableNumber > 999) {
      throw errors.validation("Table number must be less than 1000");
    }

    try {
      // Update the session
      const updatedSession = await this.sessionRepository.updateSession(id, {
        tableNumber,
      });
      if (!updatedSession) {
        throw errors.notFound("Session", id);
      }
      return updatedSession;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.internal("Failed to update session", error);
    }
  }

  /**
   * Get count of active sessions
   */
  async getActiveSessionsCount(): Promise<number> {
    try {
      // TODO: Implement count method in repository
      // For now, return 0 as placeholder
      return 0;
    } catch (error) {
      throw errors.internal("Failed to get active sessions count", error);
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<SessionStats> {
    try {
      // TODO: Implement proper stats calculation
      // This would require aggregation queries in the repository
      return {
        totalSessions: 0,
        activeSessions: await this.getActiveSessionsCount(),
        averageSessionDuration: 0,
        sessionsToday: 0,
      };
    } catch (error) {
      throw errors.internal("Failed to fetch session statistics", error);
    }
  }

  /**
   * Validate session data
   */
  async validateSessionData(data: CreateSessionData): Promise<void> {
    // Validate table number if provided
    if (data.tableNumber !== undefined && data.tableNumber !== null) {
      if (!Number.isInteger(data.tableNumber) || data.tableNumber <= 0) {
        throw errors.validation("Table number must be a positive integer");
      }

      if (data.tableNumber > 999) {
        throw errors.validation("Table number must be less than 1000");
      }
    }
  }
}

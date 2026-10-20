/**
 * Service for GitHub Repository Connections
 * Handles CRUD and Webhook auto-registration.
 */
import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/apiEndpoints';

class ConnectionsService {
  /**
   * Fetch all registered connections
   * @returns {Promise<Array<{id: string, repoFullName: string, webhookSecret: string, createdAt: string, updatedAt: string}>>}
   */
  async getConnections() {
    return apiClient.get(ENDPOINTS.CONNECTIONS.BASE);
  }

  /**
   * Fetch a single connection by ID
   * @param {string} id
   */
  async getConnectionById(id) {
    return apiClient.get(ENDPOINTS.CONNECTIONS.BY_ID(id));
  }

  /**
   * Register a new GitHub repository with PAT
   * @param {{ repoFullName: string, githubToken: string }} payload
   */
  async createConnection(payload) {
    return apiClient.post(ENDPOINTS.CONNECTIONS.BASE, payload);
  }

  /**
   * Disconnect and delete a repository connection
   * @param {string} id
   */
  async deleteConnection(id) {
    return apiClient.delete(ENDPOINTS.CONNECTIONS.BY_ID(id));
  }

  /**
   * Auto-register webhook on GitHub for the connected repository
   * @param {string} id
   */
  async registerWebhook(id) {
    return apiClient.post(ENDPOINTS.CONNECTIONS.WEBHOOK(id));
  }
}

export const connectionsService = new ConnectionsService();
export default connectionsService;

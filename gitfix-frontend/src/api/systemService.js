/**
 * Service for Spring Boot Actuator & System Health
 */
import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/apiEndpoints';

class SystemService {
  /**
   * Check Spring Boot Actuator Health (DB, Disk, Ping)
   */
  async getHealth() {
    return apiClient.get(ENDPOINTS.SYSTEM.HEALTH, { timeout: 6000 });
  }
}

export const systemService = new SystemService();
export default systemService;

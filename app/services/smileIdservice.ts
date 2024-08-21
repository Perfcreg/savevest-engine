import { IDApi } from 'smile-identity-core';
import env from '#start/env'


interface PartnerParams {
  job_id: string;
  user_id: string;
  job_type: number;
  [key: string]: string | number;
}

interface IDInfo {
  first_name: string;
  last_name: string;
  country: string;
  id_type: string;
  id_number: string;
  dob: string; // Format: yyyy-mm-dd
  phone_number: string;
}

// interface JobOptions {
//   signature: boolean;
// }

export class SmileIDService {
  private api: IDApi;

  constructor(
    // private sidServer: number // 0 for sandbox, 1 for production
  ) {
    this.api = new IDApi(env.get('SMILE_ID_PARTNER'), env.get('SMILE_ID_KEY'), 1);
  }
  /**
   * Submits a KYC job to Smile Identity for verification.
   * @param trackingParams Parameters for tracking the job.
   * @param idInfo User's identity information.
   * @param options Additional job options.
   * @returns A promise representing the response from the submit_job call.
   */
  async submitKYCJob(trackingParams: PartnerParams, idInfo: IDInfo): Promise<any> {
    try {
      const response = await this.api.submit_job(trackingParams, idInfo);
      return response;
    } catch (error) {
      console.error('Error submitting KYC job:', error);
      throw error; // Rethrow to allow caller to handle the error if needed
    }
  }
}

// hthid is it
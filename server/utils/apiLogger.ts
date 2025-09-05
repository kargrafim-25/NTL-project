import fs from 'fs';
import path from 'path';

export interface APILogEntry {
  timestamp: string;
  userId: string;
  timeframe: string;
  subscriptionTier: string;
  request: {
    symbol: string;
    timeframe: string;
    userTier: string;
  };
  response: any;
  executionTime: number;
  success: boolean;
  error?: string;
}

class APILogger {
  private logsDir = path.join(process.cwd(), 'logs');

  constructor() {
    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  async logSignalGeneration(entry: APILogEntry): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `signal-generation-${date}.json`;
      const filepath = path.join(this.logsDir, filename);

      let existingLogs: APILogEntry[] = [];
      
      // Read existing logs if file exists
      if (fs.existsSync(filepath)) {
        const fileContent = fs.readFileSync(filepath, 'utf8');
        try {
          existingLogs = JSON.parse(fileContent);
        } catch (parseError) {
          console.error('Error parsing existing log file:', parseError);
          existingLogs = [];
        }
      }

      // Add new entry
      existingLogs.push(entry);

      // Write back to file
      fs.writeFileSync(filepath, JSON.stringify(existingLogs, null, 2));
      console.log(`API call logged to: ${filename}`);

    } catch (error) {
      console.error('Error logging API call:', error);
    }
  }

  async getLogsByDate(date: string): Promise<APILogEntry[]> {
    try {
      const filename = `signal-generation-${date}.json`;
      const filepath = path.join(this.logsDir, filename);

      if (!fs.existsSync(filepath)) {
        return [];
      }

      const fileContent = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  }

  async getAllLogFiles(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.logsDir);
      return files.filter(file => file.startsWith('signal-generation-') && file.endsWith('.json'));
    } catch (error) {
      console.error('Error reading log directory:', error);
      return [];
    }
  }
}

export const apiLogger = new APILogger();
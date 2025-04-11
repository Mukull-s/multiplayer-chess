class MatchmakingService {
  constructor() {
    this.isInQueue = false;
    this.queueCheckInterval = null;
  }

  async joinQueue() {
    try {
      const response = await fetch('http://localhost:5000/api/matchmaking/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      this.isInQueue = true;

      // If a match was found immediately
      if (data.gameId) {
        this.isInQueue = false;
        return {
          gameId: data.gameId,
          opponent: data.opponent
        };
      }

      // Start checking queue status
      this.startQueueCheck();

      return {
        inQueue: true,
        message: 'Waiting for opponent'
      };
    } catch (error) {
      console.error('Error joining queue:', error);
      throw error;
    }
  }

  async leaveQueue() {
    try {
      const response = await fetch('http://localhost:5000/api/matchmaking/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      this.isInQueue = false;
      this.stopQueueCheck();

      return data;
    } catch (error) {
      console.error('Error leaving queue:', error);
      throw error;
    }
  }

  async getQueueStatus() {
    try {
      const response = await fetch('http://localhost:5000/api/matchmaking/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      console.error('Error getting queue status:', error);
      throw error;
    }
  }

  startQueueCheck() {
    // Check queue status every 5 seconds
    this.queueCheckInterval = setInterval(async () => {
      try {
        const status = await this.getQueueStatus();
        if (!status.inQueue) {
          this.stopQueueCheck();
        }
      } catch (error) {
        console.error('Error checking queue status:', error);
        this.stopQueueCheck();
      }
    }, 5000);
  }

  stopQueueCheck() {
    if (this.queueCheckInterval) {
      clearInterval(this.queueCheckInterval);
      this.queueCheckInterval = null;
    }
  }
}

const matchmakingService = new MatchmakingService();
export { matchmakingService }; 
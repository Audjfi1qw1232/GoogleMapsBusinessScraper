declare module 'user-agents' {
  interface UserAgentOptions {
    deviceCategory?: 'desktop' | 'mobile' | 'tablet';
    platform?: string;
  }

  class UserAgent {
    constructor(options?: UserAgentOptions);
    toString(): string;
    data: any;
  }

  export = UserAgent;
}
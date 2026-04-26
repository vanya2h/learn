export interface JobListing {
  id: string;
  source: string;
  url: string;
  title: string;
  company: string;
  location?: string;
  remote?: boolean;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    raw?: string;
  };
  posted_at?: string;
  tags?: string[];
  raw_text: string;
}

export interface JobProvider {
  readonly name: string;
  fetch(): Promise<JobListing[]>;
  count?(): Promise<number>;
}

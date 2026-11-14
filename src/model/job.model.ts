export interface JobModel {
  id?: number;
  title: string;
  company: string;
  location?: string;
  description?: string;
  salary?: string;
  postedAt?: Date;
  updatedAt?: Date;
  s_delete?: number;
}

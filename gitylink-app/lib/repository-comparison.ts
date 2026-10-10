export type RepositoryComparison = {
  fullName: string;
  url: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  languages: Record<string, number>;
};

export type RepositoryComparisonResponse = {
  first: RepositoryComparison;
  second: RepositoryComparison;
};

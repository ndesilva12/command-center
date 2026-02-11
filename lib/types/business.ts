// Business Info types for local business searches

export interface BusinessOwner {
  name: string;
  title?: string;
  ownership?: string;
}

export interface BusinessFiling {
  type: string;
  date: string;
  agency: string;
  status?: string;
  documentNumber?: string;
}

export interface BusinessLicense {
  type: string;
  issuedBy: string;
  issueDate?: string;
  expirationDate?: string;
  status: string;
}

export interface NewsArticle {
  title: string;
  source: string;
  date: string;
  summary: string;
  url?: string;
}

export interface BusinessSearchResult {
  name: string;
  address: string;
  city: string;
  state: string;
  type?: string;
  confidence: number;
}

export interface BusinessAnalysis {
  businessName: string;
  tradeName?: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  email?: string;

  // Business details
  businessType: string;
  industry: string;
  yearEstablished?: string;
  employeeCount?: string;
  annualRevenue?: string;

  // Ownership and leadership
  owners: BusinessOwner[];
  registeredAgent?: string;

  // Public records
  filings: BusinessFiling[];
  licenses: BusinessLicense[];

  // News and media
  newsArticles: NewsArticle[];

  // Summary
  summary: string;

  // Metadata
  searchedAt: Date;
  dataSource: string;
}

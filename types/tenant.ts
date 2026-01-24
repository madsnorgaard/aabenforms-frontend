export interface Tenant {
  name: string
  domain: string
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  settings?: {
    [key: string]: any
  }
}

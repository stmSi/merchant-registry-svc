export interface PendingMerchantInfo {
  no: number
  dbaName: string
  registeredName: string
  payintoAccount: string
  merchantType: 'individual' | 'small-shop' | 'chain-store'
  state: string
  city: string
  counterDescription: string
  registeredDfspName: string
  registrationStatus: 'pending'
}

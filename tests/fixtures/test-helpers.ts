// Shared test personas (mock MitID realm, password test1234).

/**
 * Test user personas from the Keycloak mock realm.
 * All passwords are 'test1234'.
 */
export const testUsers = {
  citizen: {
    username: 'freja.nielsen',
    password: 'test1234',
    cpr: '0101904521',
    name: 'Freja Nielsen',
    role: 'user',
  },
  businessOwner: {
    username: 'karen.christensen',
    password: 'test1234',
    cpr: '1205705432',
    name: 'Karen Christensen',
    role: 'business',
    cvr: '12345678',
  },
  parent1: {
    username: 'sofie.hansen',
    password: 'test1234',
    cpr: '2506924015',
    name: 'Sofie Hansen',
    role: 'user',
  },
  parent2: {
    username: 'lars.andersen',
    password: 'test1234',
    cpr: '0803755210',
    name: 'Lars Andersen',
    role: 'user',
  },
  protectedPerson: {
    username: 'protected.person',
    password: 'test1234',
    cpr: '0101804321',
    name: 'Protected Person',
    role: 'user',
  },
} as const

export type TestUser = typeof testUsers[keyof typeof testUsers]

export const E2E_USERS = {
  admin: {
    email: "admin@municipality.gov",
    password: "12345678",
  },
  citizen: {
    email: "rajesh.kumar@gmail.com",
    password: "12345678",
  },
  staff: {
    email: "water.officer@municipality.gov",
    password: "12345678",
    displayName: /Water Officer/i,
  },
} as const;

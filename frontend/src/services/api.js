// Mock API для тестирования без бэкенда
const mockVacancies = [
  {
    id: 1,
    title: "Frontend Developer",
    companyName: "Tech Company", 
    location: "Moscow",
    salary: "100000-150000",
    employmentType: "FULL_TIME",
    experienceLevel: "MIDDLE",
    description: "We are looking for a skilled Frontend Developer with experience in React and modern JavaScript frameworks.",
    skills: "JavaScript, React, HTML, CSS",
    contactEmail: "hr@techcompany.com",
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 2,
    title: "Backend Developer",
    companyName: "Startup Inc",
    location: "Remote", 
    salary: "120000-180000",
    employmentType: "REMOTE",
    experienceLevel: "SENIOR",
    description: "Join our backend team to build amazing APIs and microservices.",
    skills: "Java, Spring Boot, PostgreSQL, Docker",
    contactEmail: "jobs@startup.com",
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 3,
    title: "UI/UX Designer",
    companyName: "Design Studio",
    location: "Saint Petersburg",
    salary: "80000-120000", 
    employmentType: "FULL_TIME",
    experienceLevel: "JUNIOR",
    description: "Looking for a creative UI/UX designer to join our team.",
    skills: "Figma, Adobe XD, User Research, Prototyping",
    contactEmail: "design@studio.com",
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

class MockAPI {
  static async get(url) {
    console.log('Mock API GET:', url);
    
    if (url.includes('/api/vacancies')) {
      if (url.includes('/search')) {
        const query = new URLSearchParams(url.split('?')[1]).get('query');
        const filtered = mockVacancies.filter(v => 
          v.title.toLowerCase().includes(query.toLowerCase()) ||
          v.companyName.toLowerCase().includes(query.toLowerCase()) ||
          v.skills.toLowerCase().includes(query.toLowerCase())
        );
        return { data: filtered };
      }
      return { data: mockVacancies };
    }
    
    if (url.includes('/stats/count')) {
      return { data: mockVacancies.length };
    }
    
    return { data: [] };
  }

  static async post(url, data) {
    console.log('Mock API POST:', url, data);
    
    if (url.includes('/api/auth/register')) {
      return { data: { message: "User registered successfully" } };
    }
    
    if (url.includes('/api/auth/login')) {
      return { 
        data: { 
          token: "mock-jwt-token", 
          email: data.email,
          role: "ROLE_USER"
        } 
      };
    }
    
    return { data: { success: true } };
  }
}

export default MockAPI;
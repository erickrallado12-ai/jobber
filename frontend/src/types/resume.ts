export interface PersonalDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  address: string;
  avatarUrl: string;
  jobTitle: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  highlights: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa: number;
  description: string;
}

export interface Resume {
  personalDetails: PersonalDetails;
  bio: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

export const defaultResume: Resume = {
  personalDetails: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+1",
    address: "",
    avatarUrl: "",
    jobTitle: "",
  },
  bio: "",
  experience: [],
  education: [],
  skills: [],
};

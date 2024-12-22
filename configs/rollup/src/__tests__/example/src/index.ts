interface Carrer {
  age: number;
  country: string;
  major: string;
  career: Record<string, Record<'contract' | 'full-time', { months: number; years: number }>>;
}

const Merlin: Carrer = {
  age: 22,
  country: 'Korea',
  major: 'computer-science',
  career: {
    tossinvest: {
      contract: {
        months: 9,
        years: 0,
      },

      'full-time': {
        months: 0,
        years: 0,
      },
    },
  },
};

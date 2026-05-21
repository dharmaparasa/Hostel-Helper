const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const previousMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, "0")}`;

export const seedData = {
  selectedHostelId: "all",
  hostels: [
    {
      id: "hostel-1",
      name: "Lakshmi Men's Hostel"
    },
    {
      id: "hostel-2",
      name: "Sai Ladies Stay"
    }
  ],
  tenants: [
    {
      id: "tenant-1",
      hostelId: "hostel-1",
      name: "Ravi Kumar",
      age: "24",
      mobile: "+919876543210",
      roomNumber: "101",
      entryDate: "2026-01-08",
      monthlyRent: 5000,
      additionalFees: 400,
      purposeOfStay: "Job"
      ,
      months: [
        {
          id: `${previousMonth}-ravi`,
          monthKey: previousMonth,
          rentDue: 5400,
          paid: 5400,
          dueDate: `${previousMonth}-05`,
          closedOn: `${previousMonth}-06`
        },
        {
          id: `${currentMonth}-ravi`,
          monthKey: currentMonth,
          rentDue: 5400,
          paid: 2400,
          dueDate: `${currentMonth}-05`,
          closedOn: null
        }
      ]
    },
    {
      id: "tenant-2",
      hostelId: "hostel-1",
      name: "Asha Devi",
      age: "31",
      mobile: "+919845612300",
      roomNumber: "103",
      entryDate: "2026-02-01",
      monthlyRent: 4500,
      additionalFees: 0,
      purposeOfStay: "Study",
      months: [
        {
          id: `${previousMonth}-asha`,
          monthKey: previousMonth,
          rentDue: 4500,
          paid: 3000,
          dueDate: `${previousMonth}-05`,
          closedOn: null
        },
        {
          id: `${currentMonth}-asha`,
          monthKey: currentMonth,
          rentDue: 4500,
          paid: 0,
          dueDate: `${currentMonth}-05`,
          closedOn: null
        }
      ]
    },
    {
      id: "tenant-3",
      hostelId: "hostel-2",
      name: "Meena Paul",
      age: "27",
      mobile: "+919998881234",
      roomNumber: "A-12",
      entryDate: "2026-03-18",
      monthlyRent: 6200,
      additionalFees: 600,
      purposeOfStay: "Nurse",
      months: [
        {
          id: `${currentMonth}-meena`,
          monthKey: currentMonth,
          rentDue: 6800,
          paid: 6800,
          dueDate: `${currentMonth}-05`,
          closedOn: `${currentMonth}-03`
        }
      ]
    }
  ]
};

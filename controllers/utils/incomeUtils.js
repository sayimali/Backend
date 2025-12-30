// get all data income calculation
export const calculateIncomeSummary = (AllincomeRecords) => {
  let totalAmount = 0,
    totalAmountReceived = 0,
    totalSalepersonFixedPrice = 0,
    totalExcessAmount = 0,
    totalPendingPayment = 0,
    totalPendingRecovery = 0,
    totaltechniciancost = 0,
    totaltechnicianfuel = 0,
    totalTechnicianExpanse = 0;

  const totalVehicle = new Set();
  const totalSalePerson = new Set();
  const totalTechnicianPerson = new Set();

  const categoryAggregates = {};
  const deviceCounts = {};
  const citySummary = {}; // <-- NEW

  AllincomeRecords.forEach((record) => {
    const category = (record.Category || "").toLowerCase().trim();
    const city = (record.City || "Unknown").trim();

    // Initialize category summary
    if (!categoryAggregates[category]) {
      categoryAggregates[category] = {
        Category: category,
        TotalVehicle: new Set(),
        AmountReceived: 0,
        FixedAmount: 0,
        Count: 0,
      };
    }

    const catData = categoryAggregates[category];
    catData.Count += 1;
    catData.TotalVehicle.add(record.Vehicle);
    catData.AmountReceived += Number(record.Amount_Received) || 0;
    catData.FixedAmount += Number(record.Saleperson_FixedPrice) || 0;

    totalAmount += Number(record.Total_Amount) || 0;
    totalAmountReceived += Number(record.Amount_Received) || 0;
    totalSalepersonFixedPrice += Number(record.Saleperson_FixedPrice) || 0;
    totalExcessAmount += Number(record.Excess_Amount) || 0;
    totalPendingPayment += Number(record.Pending_Payment) || 0;
    totalPendingRecovery += Number(record.Pending_Recovery) || 0;
    totaltechniciancost += Number(record.Technicianperson_Price) || 0;
    totaltechnicianfuel += Number(record.Travelling_Expense_Technician) || 0;
    totalTechnicianExpanse +=
      (Number(record.Technicianperson_Price) || 0) +
      (Number(record.Travelling_Expense_Technician) || 0);

    totalVehicle.add(record.Vehicle);
    totalSalePerson.add(record.Sale_Person_name);
    totalTechnicianPerson.add(record.Technician_Person_name);

    // Device counting
    const deviceModel = (record.Device || "").trim();
    if (deviceModel) {
      deviceCounts[deviceModel] = (deviceCounts[deviceModel] || 0) + 1;
    }

    const categoryMap = {
  "new installation": "newinstallation",
  "redo": "redo",
  "removal": "removal",
  "removal transfer": "removaltransfer",
  "transfer": "transfer",
  "ownershipchange": "ownershipchange",
};

    // ✅ City Summary Counting
    if (!citySummary[city]) {
      citySummary[city] = {
        City: city,
        newinstallation: 0,
        redo: 0,
        removal: 0,
        removaltransfer: 0,
        transfer: 0,
        ownershipchange: 0,
      };
    }

 const rawCategory = (record.Category || "").toLowerCase().trim();
  const mappedCategory = categoryMap[rawCategory];

  if (mappedCategory && citySummary[city][mappedCategory] !== undefined) {
    citySummary[city][mappedCategory] += 1;
  }
});

  const CategorySummary = Object.values(categoryAggregates).map((data) => ({
    Category: data.Category,
    Count: data.Count,
    TotalVehicle: data.TotalVehicle.size,
    AmountReceived: Math.round(data.AmountReceived),
    FixedAmount: Math.round(data.FixedAmount),

  }));

  const DeviceSummary = Object.entries(deviceCounts).map(([device, count]) => ({
    Device_Model: device,
    Count: count,
  }));

  // ✅ Format City Summary into Array
  const CitySummary = Object.values(citySummary);


  return {
    Total_Data: AllincomeRecords.length,
    Total_Vehicle: totalVehicle.size,
    Total_Sale_Person: totalSalePerson.size,
    Total_Amount_Received: Math.round(totalAmountReceived),
    Total_Saleperson_FixedPrice: Math.round(totalSalepersonFixedPrice),
    Total_Excess_Amount: Math.round(totalExcessAmount),
    Total_Pending_Payment: Math.round(totalPendingPayment),
    Total_Pending_Recovery: Math.round(totalPendingRecovery),
    Total_Technician_Person: totalTechnicianPerson.size,
    Total_TechnicianCost: Math.round(totaltechniciancost),
    Total_TechnicianFuel: Math.round(totaltechnicianfuel),
    Total_Technician_Expanse: Math.round(totalTechnicianExpanse),
    Total_Amount: Math.round(totalAmount),

    CategorySummary,
    DeviceSummary,
    CitySummary, // <-- ✅ Added here
  };
};


// it is for get single category base
export const calculateIncomeTotalsByCategory = (incomeRecords) => {
  let totalAmount = 0,
    totalAmountReceived = 0,
    totalSalepersonFixedPrice = 0,
    totalTechnicianExpanse = 0,
    totalPendingPayment = 0,
    totalExcessAmount = 0,
    totalPendingRecovery = 0,
    totalSubscriptionAmount = 0,
    totalRemainingAmount = 0; // Added missing variable

  let totalVehicles = new Set();
  let totalSalePersons = new Set();
  let totalTechnicianPersons = new Set();

  incomeRecords.forEach((record) => {
    const amountReceived = Number(record.Amount_Received) || 0;
    const fixedPrice = Number(record.Saleperson_FixedPrice) || 0;
    const excessAmount = Number(record.Excess_Amount) || 0;
    const pendingPayment = Number(record.Pending_Payment) || 0;
    const pendingRecovery = Number(record.Pending_Recovery) || 0;
    const technicianCost = Number(record.Technicianperson_Price) || 0;
    const technicianFuel = Number(record.Travelling_Expense_Technician) || 0;
    const subscriptionAmount = Number(record.Subscription_Amount) || 0;

    totalAmount += Number(record.Total_Amount) || 0;
    totalAmountReceived += amountReceived;
    totalSalepersonFixedPrice += fixedPrice;
    totalExcessAmount += excessAmount;
    totalPendingPayment += pendingPayment;
    totalPendingRecovery += pendingRecovery;
    totalTechnicianExpanse += technicianCost + technicianFuel;
    totalSubscriptionAmount += subscriptionAmount;

    totalVehicles.add(record.Vehicle);
    totalSalePersons.add(record.Sale_Person_name);
    totalTechnicianPersons.add(record.Technician_Person_name);

    // Handle Category-based logic
    switch (record.Category) {
      case "New Installation":
        record.Pending_Payment = record.Inofcsaleperson === "Yes"
          ? Math.max(subscriptionAmount - amountReceived, 0)
          : Math.max(fixedPrice - amountReceived, 0);

   /*     if (record.Techniciancost === "Company") {
          record.Pending_Payment = Math.max(record.Pending_Payment - technicianCost, 0);
        } else if (record.Techniciancost === "Saleperson") {
          record.Excess_Amount = Math.max(record.Excess_Amount - technicianCost, 0);
        }
*/
        if (record.Technicianfuel === "Saleperson") {
          record.fixedPrice = Math.max(record.fixedPrice + technicianFuel, 0);
      }

      record.Excess_Amount = record.Inofcsaleperson !== "Yes"
      ? Math.max(amountReceived - fixedPrice, 0)
      : 0;

        break;

        case "AMC":
          if (record.amountReceived > record.fixedPrice) {
            record.Excess_Amount = amountReceived - fixedPrice;
            record.Pending_Payment = 0;
          } else {
            record.Excess_Amount = 0;
            record.Pending_Payment = fixedPrice - amountReceived;
          }        
    
          break;
      
      case "Redo":
             if (record.subscriptionAmount > record.amountReceived ) {
              record.Excess_Amount = 0;
              record.Pending_Payment = amountReceived - subscriptionAmount;
                  } 

        if (record.Techniciancost === "Company") {
          record.Amount_Received = Math.max(amountReceived - totalTechnicianExpanse, 0);
        }
        record.Total_Amount = record.Amount_Received;
        break;

      case "Recovery":
    
        break;

      case "Removal":
      case "Removal Transfer":
      case "Transfer":
        if (record.subscriptionAmount > record.amountReceived ) {
          record.Excess_Amount = 0;
          record.Pending_Payment = amountReceived - subscriptionAmount;
        } 
        break;

      case "OwnerShipChange":
        if (record.subscriptionAmount > record.amountReceived ) {
          record.Excess_Amount = 0;
          record.Pending_Payment = amountReceived - subscriptionAmount;
        } 
        if (record.subscriptionAmount > record.amountReceived ) {
          record.Excess_Amount = 0;
          record.Pending_Payment = amountReceived - subscriptionAmount;
        } 
        break;

      default:
        console.warn(`Invalid category encountered: ${record.Category}`);
    }
  });

  return {
    Total_Data: incomeRecords.length,
    Total_Vehicle: totalVehicles.size,
    Total_Sale_Person: totalSalePersons.size,
    Total_Technician_Person: totalTechnicianPersons.size,
    totalAmountReceived: parseFloat(totalAmountReceived.toFixed(2)),
    totalSalepersonFixedPrice: parseFloat(totalSalepersonFixedPrice.toFixed(2)),
    totalRemainingAmount: parseFloat(totalRemainingAmount.toFixed(2)), // Fixed missing variable
    totalTechnicianExpanse: parseFloat(totalTechnicianExpanse.toFixed(2)),
    totalPendingPayment: parseFloat(totalPendingPayment.toFixed(2)),
    totalExcessAmount: parseFloat(totalExcessAmount.toFixed(2)),
    totalPendingRecovery: parseFloat(totalPendingRecovery.toFixed(2)),
    totalSubscriptionAmount: parseFloat(totalSubscriptionAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};

// get saleperson calculation api 

export const calculateIncomeTotalsSaleperson = (incomeRecordsBySaleperson) => {
    let totalVehicle = new Set();
    let totalSalePerson = new Set();
    let totalTechnicianPerson = new Set();
    let totalAmountReceived = 0;
    let totalSalepersonFixedPrice = 0;
    let totalExcessAmount = 0;
    let totalPendingPayment = 0;
    let totalPendingRecovery = 0;
    let totalTechnicianExpanse = 0;
    let totalSubscriptionAmount = 0;
    let technicianFuel = 0;
    let totalAmount = 0;
  
    for (const record of incomeRecordsBySaleperson) {
      let technicianExpanse = parseFloat(record.Technician_Expanse) || 0;
      let amountReceived = parseFloat(record.Amount_Received) || 0;
      let fixedPrice = parseFloat(record.Saleperson_FixedPrice) || 0;
      let pendingRecovery = parseFloat(record.Pending_Recovery) || 0;
      let subscriptionAmount = parseFloat(record.Subscription_Amount) || 0;
      let pendingPayment = parseFloat(record.Pending_Payment) || 0;
      let excessAmount = parseFloat(record.Excess_Amount) || 0;
  
      totalAmountReceived += amountReceived;
      totalSalepersonFixedPrice += fixedPrice;
      totalExcessAmount += excessAmount;
      totalPendingPayment += pendingPayment;
      totalPendingRecovery += pendingRecovery;
      totalTechnicianExpanse += technicianExpanse;
      totalSubscriptionAmount += subscriptionAmount;
  
      // Unique counts
      if (record.Vehicle) totalVehicle.add(record.Vehicle);
      if (record.Sale_Person_name) totalSalePerson.add(record.Sale_Person_name);
      if (record.Technician_Person_name) totalTechnicianPerson.add(record.Technician_Person_name);
  
      // Category-based calculations
      switch (record.Category) {
        case "New Installation":
          record.Pending_Payment = record.Inofcsaleperson === "Yes"
            ? Math.max(subscriptionAmount - amountReceived, 0)
            : Math.max(fixedPrice - amountReceived, 0);
  
     /*     if (record.Techniciancost === "Company") {
            record.Pending_Payment = Math.max(record.Pending_Payment - technicianCost, 0);
          } else if (record.Techniciancost === "Saleperson") {
            record.Excess_Amount = Math.max(record.Excess_Amount - technicianCost, 0);
          }
  */
          if (record.Technicianfuel === "Saleperson") {
            record.fixedPrice = Math.max(record.fixedPrice + technicianFuel, 0);
        }
  
        record.Excess_Amount = record.Inofcsaleperson !== "Yes"
        ? Math.max(amountReceived - fixedPrice, 0)
        : 0;
  
          break;
  
          case "AMC":
            if (record.amountReceived > record.fixedPrice) {
              record.Excess_Amount = amountReceived - fixedPrice;
              record.Pending_Payment = 0;
            } else {
              record.Excess_Amount = 0;
              record.Pending_Payment = fixedPrice - amountReceived;
            }        
      
            break;
        
        case "Redo":
               if (record.subscriptionAmount > record.amountReceived ) {
                record.Excess_Amount = 0;
                record.Pending_Payment = amountReceived - subscriptionAmount;
                    } 
  
          if (record.Techniciancost === "Company") {
            record.Amount_Received = Math.max(amountReceived - totalTechnicianExpanse, 0);
          }
          record.Total_Amount = record.Amount_Received;
          break;
  
        case "Recovery":
        
          break;
  
        case "Removal":
        case "Removal Transfer":
        case "Transfer":
          if (record.subscriptionAmount > record.amountReceived ) {
            record.Excess_Amount = 0;
            record.Pending_Payment = amountReceived - subscriptionAmount;
          } 
          break;
  
        case "OwnerShipChange":
          if (record.subscriptionAmount > record.amountReceived ) {
            record.Excess_Amount = 0;
            record.Pending_Payment = amountReceived - subscriptionAmount;
          } 
          if (record.subscriptionAmount > record.amountReceived ) {
            record.Excess_Amount = 0;
            record.Pending_Payment = amountReceived - subscriptionAmount;
          } 
          break;
  
        default:
          console.warn(`Invalid category encountered: ${record.Category}`);
      }
    }
    
    return {
      Total_Data: incomeRecordsBySaleperson.length,
      Total_Vehicle: totalVehicle.size,
      Total_Sale_Person: totalSalePerson.size,
      Total_Technician_Person: totalTechnicianPerson.size,
      Total_Amount_Received: parseFloat(totalAmountReceived.toFixed(2)),
      Total_Saleperson_FixedPrice: parseFloat(totalSalepersonFixedPrice.toFixed(2)),
      Total_Excess_Amount: parseFloat(totalExcessAmount.toFixed(2)),
      Total_Pending_Payment: parseFloat(totalPendingPayment.toFixed(2)),
      Total_Pending_Recovery: parseFloat(totalPendingRecovery.toFixed(2)),
      Total_Technician_Expanse: parseFloat(totalTechnicianExpanse.toFixed(2)),
      Total_Subscription_Amount: parseFloat(totalSubscriptionAmount.toFixed(2)),
      Total_Amount: parseFloat(totalAmount.toFixed(2)),
    };
  };

//saleperson summary
export const generateSalespersonSummary = (incomeRecords) => {
  const summaryBySalesperson = {};

  for (const record of incomeRecords) {
    const name = record.Sale_Person_name || "Unknown";
    const category = record.Category;
    const amountReceived = parseFloat(record.Amount_Received) || 0;
    const fixedPrice = parseFloat(record.Saleperson_FixedPrice) || 0;
    const excess = parseFloat(record.Excess_Amount) || 0;
    const pending = parseFloat(record.Pending_Payment) || 0;

    if (!summaryBySalesperson[name]) {
      summaryBySalesperson[name] = {
        Installation: 0,
        Received: 0,
        FixedPrice: 0,
        Excess: 0,
        Pending: 0,
      };
    }

    // Count category only if it's New Installation
    if (category === "New Installation") {
      summaryBySalesperson[name].Installation += 1;
    }

    // Accumulate financial values
    summaryBySalesperson[name].Received += amountReceived;
    summaryBySalesperson[name].FixedPrice += fixedPrice;
    summaryBySalesperson[name].Excess += excess;
    summaryBySalesperson[name].Pending += pending;
  }

  // Round all financial values to 2 decimal places
  for (const person in summaryBySalesperson) {
    const s = summaryBySalesperson[person];
    s.Received = parseFloat(s.Received.toFixed(2));
    s.FixedPrice = parseFloat(s.FixedPrice.toFixed(2));
    s.Excess = parseFloat(s.Excess.toFixed(2));
    s.Pending = parseFloat(s.Pending.toFixed(2));
  }

  return summaryBySalesperson;
};



// calculate the technician api calculatio
  
  export const calculateTotalstechnician = (incomeRecords) => {
    let uniqueSalePersons = new Set();
    let uniqueVehicles = new Set();
    let uniqueTechnicianPersons = new Set();
    
    let totalSalePerson = 0;
    let totalVehicle = 0;
    let totalTechnicianPerson = 0;
    let totalAmountReceived = 0;
    let totalSalepersonFixedPrice = 0;
    let totalTechnicianExpanse = 0;
    let technicianfuel = 0;
    let totalPendingPayment = 0;
    let totalExcessAmount = 0;
    let totalPendingRecovery = 0;
    let totalSubscriptionAmount = 0;
    let totalAmount = 0;
  
    incomeRecords.forEach(record => {
        const technicianExpanse = parseFloat(record.Technician_Expanse) || 0;
        const amountReceived = parseFloat(record.Amount_Received) || 0;
        const fixedPrice = parseFloat(record.Saleperson_FixedPrice) || 0;
        const pendingRecovery = parseFloat(record.Pending_Recovery) || 0;
        const subscriptionAmount = parseFloat(record.Subscription_Amount) || 0;
        const pendingPayment = parseFloat(record.Pending_Payment) || 0;
        const excessAmount = parseFloat(record.Excess_Amount) || 0;
  
        if (record.Sale_Person_name) uniqueSalePersons.add(record.Sale_Person_name);
        if (record.Vehicle) uniqueVehicles.add(record.Vehicle);
        if (record.Technician_Person_name) uniqueTechnicianPersons.add(record.Technician_Person_name);
  
        let adjustedExcessAmount = excessAmount;
        let adjustedAmountReceived = amountReceived;
  
        totalAmountReceived += adjustedAmountReceived;
        totalSalepersonFixedPrice += fixedPrice;
        totalTechnicianExpanse += technicianExpanse;
        totalPendingPayment += pendingPayment;
        totalExcessAmount += adjustedExcessAmount;
        totalPendingRecovery += pendingRecovery;
        totalSubscriptionAmount += subscriptionAmount;
  
        switch (record.Category) {
          case "New Installation":
            record.Pending_Payment = record.Inofcsaleperson === "Yes"
              ? Math.max(subscriptionAmount - amountReceived, 0)
              : Math.max(fixedPrice - amountReceived, 0);
    
       /*     if (record.Techniciancost === "Company") {
              record.Pending_Payment = Math.max(record.Pending_Payment - technicianCost, 0);
            } else if (record.Techniciancost === "Saleperson") {
              record.Excess_Amount = Math.max(record.Excess_Amount - technicianCost, 0);
            }
    */
            if (record.Technicianfuel === "Saleperson") {
              record.fixedPrice = Math.max(record.fixedPrice + technicianfuel, 0);
          }

          record.Excess_Amount = record.Inofcsaleperson !== "Yes"
          ? Math.max(amountReceived - fixedPrice, 0)
          : 0;
    
            break;
    
            case "AMC":
              if (record.amountReceived > record.fixedPrice) {
                record.Excess_Amount = amountReceived - fixedPrice;
                record.Pending_Payment = 0;
              } else {
                record.Excess_Amount = 0;
                record.Pending_Payment = fixedPrice - amountReceived;
              }        
        
              break;
          
          case "Redo":
                 if (record.subscriptionAmount > record.amountReceived ) {
                  record.Excess_Amount = 0;
                  record.Pending_Payment = amountReceived - subscriptionAmount;
                      } 
    
            if (record.Techniciancost === "Company") {
              record.Amount_Received = Math.max(amountReceived - totalTechnicianExpanse, 0);
            }
            record.Total_Amount = record.Amount_Received;
            break;
    
          case "Recovery":
      
            break;
    
          case "Removal":
          case "Removal Transfer":
          case "Transfer":
            if (record.subscriptionAmount > record.amountReceived ) {
              record.Excess_Amount = 0;
              record.Pending_Payment = amountReceived - subscriptionAmount;
            } 
            break;
    
          case "OwnerShipChange":
            if (record.subscriptionAmount > record.amountReceived ) {
              record.Excess_Amount = 0;
              record.Pending_Payment = amountReceived - subscriptionAmount;
            } 
            if (record.subscriptionAmount > record.amountReceived ) {
              record.Excess_Amount = 0;
              record.Pending_Payment = amountReceived - subscriptionAmount;
            } 
            break;
    
          default:
            console.warn(`Invalid category encountered: ${record.Category}`);
        }
    });
  
    totalSalePerson = uniqueSalePersons.size;
    totalVehicle = uniqueVehicles.size;
    totalTechnicianPerson = uniqueTechnicianPersons.size;
  
    return {
        Total_Data: incomeRecords.length,
        Total_Sale_Person: totalSalePerson,
        Total_Vehicle: totalVehicle,
        Total_Technician_Person: totalTechnicianPerson,
        Total_Amount_Received: Math.round(totalAmountReceived),
        Total_Saleperson_FixedPrice: Math.round(totalSalepersonFixedPrice),
        Total_Technician_Expanse: Math.round(totalTechnicianExpanse),
        Total_Pending_Payment: Math.round(totalPendingPayment),
        Total_Excess_Amount: Math.round(totalExcessAmount),
        Total_Pending_Recovery: Math.round(totalPendingRecovery),
        Total_Subscription_Amount: Math.round(totalSubscriptionAmount),
        Total_Amount: Math.round(totalAmount),
    };
  };
  

  export const generateTechnicianSummary = (records) => {
  const technicianSummary = {};
  const cities = new Set();

  records.forEach((record) => {
    const techName = record.Technician_Person_name || "Unknown";
    const category = (record.Category || "").toLowerCase().trim();
    const techCost = parseFloat(record.Technicianperson_Price) || 0;
    const techFuel = parseFloat(record.Travelling_Expense_Technician) || 0;

    // Add city if exists
    if (record.City) cities.add(record.City);

    // Initialize tech row
    if (!technicianSummary[techName]) {
      technicianSummary[techName] = {
        Installation: 0,
        Redo: 0,
        Removal: 0,
        RemovalTransfer: 0,
        Transfer: 0,
        Techcost: 0,
        techfuel: 0,
        totalexpanse: 0,
      };
    }

    // Count categories
    if (category === "new installation") technicianSummary[techName].Installation += 1;
    else if (category === "redo") technicianSummary[techName].Redo += 1;
    else if (category === "removal") technicianSummary[techName].Removal += 1;
    else if (category === "removal transfer") technicianSummary[techName].RemovalTransfer += 1;
    else if (category === "transfer") technicianSummary[techName].Transfer += 1;

    // Accumulate costs
    technicianSummary[techName].Techcost += techCost;
    technicianSummary[techName].techfuel += techFuel;
    technicianSummary[techName].totalexpanse += techCost + techFuel;
  });

  const technicianSummaryArray = Object.entries(technicianSummary).map(([tech, values]) => ({
    Technician: tech,
    ...values,
  }));

  return {
    technicianSummary: technicianSummaryArray,
    totalcity: cities.size,
    citynames: Array.from(cities).join(', '),
  };
};

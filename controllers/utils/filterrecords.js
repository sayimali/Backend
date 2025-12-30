export const buildFilter = (queryParams, allowedFields) => {
   let filter = {};
 
   Object.keys(queryParams).forEach((key) => {
     if (!allowedFields.includes(key)) return; // Ignore non-allowed fields
 
     const value = queryParams[key];
 
     // **✅ Handle Date Filtering (gte, lte)**
     if (key.endsWith("_gte")) {
       const field = key.replace("_gte", "");
       filter[field] = { ...filter[field], $gte: new Date(value) };
     } else if (key.endsWith("_lte")) {
       const field = key.replace("_lte", "");
       filter[field] = { ...filter[field], $lte: new Date(value) };
     }
 
     // **✅ Handle Number Filtering (gte, lte)**
     else if (key.endsWith("_gte") || key.endsWith("_lte")) {
       const field = key.replace("_gte", "").replace("_lte", "");
       filter[field] = { ...filter[field], [key.endsWith("_gte") ? "$gte" : "$lte"]: parseFloat(value) };
     }
 
     // **✅ Handle Partial Text Search**
     else if (key.endsWith("_like")) {
       const field = key.replace("_like", "");
       filter[field] = { $regex: value, $options: "i" }; // Case-insensitive search
     }
 
     // **✅ Default Exact Match Filtering**
     else {
       filter[key] = value;
     }
   });
 
   return filter;
 };
 
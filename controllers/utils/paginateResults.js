export const paginateResults = async (model, filter = {}, page = 1, pageSize = 10, sort = { createdAt: -1 }) => {
  page = parseInt(page);
  pageSize = pageSize === "All" ? 0 : parseInt(pageSize); // If "All" is selected, show all records

  const totalRecords = await model.countDocuments(filter);
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalRecords / pageSize); // If "All" is selected, only one page

  // **Pagination Logic**
  const query = model.find(filter).sort(sort);
  if (pageSize !== 0) {
    query.skip((page - 1) * pageSize).limit(pageSize);
  }
  
  const records = await query.exec();

  return {
    records,
    totalRecords,
    totalPages,
    currentPage: page,
    pageSize: pageSize === 0 ? "All" : pageSize,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    pageOptions: [1000, 2000, 3000, 4000,5000,6000,7000,8000,9000, "All"], // Available page size options
  };
};

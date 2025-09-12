//photocardHelpers.js

// Photocard form data
const preparePhotocardData = (req, body, file) => {
  const data = {
    name: body.name,
    age: body.age || "",
    condition: body.condition || null,
    biography: body.biography || "",
    isConfirmedDuplicate: body.isConfirmedDuplicate === "true",
  };

  if (body.isConfirmedDuplicate === "true" && body.duplicateOf) {
    data.duplicateOf = body.duplicateOf;
  }

  if (file) {
    data.image = file.filename;
  } else if (body.image === "") {
    data, (image = "");
  }

  return data;
};

// Duplicates
const duplicatePhotocardsQuery = (name, age) => {
  const ageRange = 3;

  const query = { name: { $regex: new RegExp(`^${name}$`, "i") } };

  if (age) {
    query.$and = [{ age: { $gte: age - ageRange, $lte: age + ageRange } }];
  }

  return query;
};

module.exports = { preparePhotocardData, duplicatePhotocardsQuery };

//photocardHelpers.js

// Photocard form data
const preparePhotocardData = (req, body, file) => {
  const data = {
    name: body.name,
    isUnidentified: body.isUnidentified === "true",
    age: body.age || "",
    months: body.months || null,
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
    data.image = "";
  }

  return data;
};

// Duplicates
const duplicatePhotocardsQuery = (name, age, months) => {
  const ageRange = 3;

  const query = {
    name: { $regex: new RegExp(`^${name}$`, "i") },
    isUnidentified: false,
  };

  if (age) {
    query.$and = [{ age: { $gte: age - ageRange, $lte: age + ageRange } }];
  }

  if (parseInt(age) < 3 && months) {
    const monthRange = 3;
    query.$and.push({
      months: { $gte: months - monthRange, $lte: months + monthRange },
    });
  }

  return query;
};

module.exports = { preparePhotocardData, duplicatePhotocardsQuery };

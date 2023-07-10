const crypto = require("crypto");
const fs = require("fs");

if (process.argv[2] === undefined) {
  console.error("Provide input file.");
  process.exit(1);
}

const input = fs.readFileSync(process.argv[2], "utf8");
const { folders, items: bitwardenItems } = JSON.parse(input);

const logins = bitwardenItems.filter(item => item.type === 1);
const cards = bitwardenItems.filter(item => item.type === 3);

const uuid = () =>
  crypto
    .randomBytes(16)
    .toString("hex")
    .toUpperCase();

const newLogins = logins.map(item => {
  const uris = item.login.uris;
  const uri = uris && uris.length ? uris[0].uri : null;
  const customFields = (item.fields || []).map(({ name, value }) => {
    return { k: "concealed", v: value, t: name };
  }, {});

  return {
    title: item.name,

    openContents: item.folderId
      ? {
          tags: [folders.find(folder => folder.id === item.folderId).name]
        }
      : {},

    secureContents: {
      URLs: uri
        ? [
            {
              url: uri,
              label: "website"
            }
          ]
        : [],

      fields: [
        {
          type: "T",
          designation: "username",
          name: "username",
          value: item.login.username
        },
        {
          type: "P",
          designation: "password",
          name: "password",
          value: item.login.password
        }
      ],

      notesPlain: item.notes,

      ...(customFields
        ? {
            sections: [
              {
                fields: customFields,
                title: "Custom Fields from Bitwarden",
                name: `Section_${uuid()}`
              }
            ]
          }
        : {})
    },
    location: uri,
    typeName: "webforms.WebForm"
  };
});

const cardTypeMap = {
  Visa: "visa",
  Mastercard: "mc"
};

const newCards = cards.map(item => {
  return {
    title: item.name,

    openContents: item.folderId
      ? {
          tags: [folders.find(folder => folder.id === item.folderId).name]
        }
      : {},

    secureContents: {
      cardholder: item.card.cardholderName,
      type: cardTypeMap[item.card.brand],
      ccnum: item.card.number,
      expiry_mm: item.card.expMonth,
      expiry_yy: item.card.expYear,
      code: item.card.cvv,

      notesPlain: item.notes
    },
    typeName: "wallet.financial.CreditCard"
  };
});

const lines = [...newLogins, ...newCards]
  .map(item => JSON.stringify(item, null, ""))
  .join("\n***5642bee8-a5ff-11dc-8314-0800200c9a66***\n")
  .concat("\n***5642bee8-a5ff-11dc-8314-0800200c9a66***");

console.log(lines);

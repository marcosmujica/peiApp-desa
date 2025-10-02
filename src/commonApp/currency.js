export const currencyList = 
[
    {
      "country": "Argentina",
      "country_code": "AR",
      "name": "Peso argentino",
      "symbol": "$",
      "currency_code": "ARS",
      "id": "AR"
    },
    {
      "country": "Bolivia",
      "country_code": "BO",
      "name": "Boliviano",
      "symbol": "Bs",
      "currency_code": "BOB",
      "id": "BO"
    },
    {
      "country": "Brasil",
      "country_code": "BR",
      "name": "Real",
      "symbol": "R$",
      "currency_code": "BRL",
      "id": "BR"
    },
    {
      "country": "Chile",
      "country_code": "CL",
      "name": "Peso chileno",
      "symbol": "$",
      "currency_code": "CLP",
      "id": "CL"
    },
    {
      "country": "Colombia",
      "country_code": "CO",
      "name": "Peso colombiano",
      "symbol": "$",
      "currency_code": "COP",
      "id": "CO"
    },
    {
      "country": "Costa Rica",
      "country_code": "CR",
      "name": "Colón",
      "symbol": "₡",
      "currency_code": "CRC",
      "id": "CR"
    },
    {
      "country": "Cuba",
      "country_code": "CU",
      "name": "Peso cubano",
      "symbol": "$",
      "currency_code": "CUP",
      "id": "CU"

    },
    {
      "country": "Ecuador",
      "country_code": "EC",
      "name": "Dólar",
      "symbol": "US$",
      "currency_code": "USE",
      "id": "EC"
    },
    {
      "country": "El Salvador",
      "country_code": "SV",
      "name": "Dólar/Bitcoin",
      "symbol": "US$ / ₿",
      "currency_code": "BTC",
      "id": "SV"
    },
    {
      "country": "Estados Unidos",
      "country_code": "US",
      "name": "Dólar",
      "symbol": "$",
      "currency_code": "USD",
      "id": "US"

    },
    {
      "country": "Guatemala",
      "country_code": "GT",
      "name": "Quetzal",
      "symbol": "Q",
      "currency_code": "GTQ",
      "id": "GT"
    },
    {
      "country": "Honduras",
      "country_code": "HN",
      "name": "Lempira",
      "symbol": "L",
      "currency_code": "HNL",
      "id": "HN"
    },
    {
      "country": "México",
      "country_code": "MX",
      "name": "Peso mexicano",
      "symbol": "$",
      "currency_code": "MXN",
      "id": "MX"
    },
    {
      "country": "Nicaragua",
      "country_code": "NI",
      "name": "Córdoba nicaragüense",
      "symbol": "C$",
      "currency_code": "NIO",
      "id": "NI"
    },
    {
      "country": "Panamá",
      "country_code": "PA",
      "name": "Balboa/Dólar",
      "symbol": "B/. / US$",
      "currency_code": "PAB",
      "id": "PA"
    },
    {
      "country": "Paraguay",
      "country_code": "PY",
      "name": "Guaraní",
      "symbol": "₲",
      "currency_code": "PYG",
      "id": "PY"
    },
    {
      "country": "Perú",
      "country_code": "PE",
      "name": "Sol",
      "symbol": "S/",
      "currency_code": "PEN",
      "id": "PE"
    },
    {
      "country": "República Dominicana",
      "country_code": "DO",
      "name": "Peso dominicano",
      "symbol": "RD$",
      "currency_code": "DOP",
      "id": "DO"
    },
    {
      "country": "Uruguay",
      "country_code": "UY",
      "name": "Peso uruguayo",
      "symbol": "$",
      "currency_code": "UYU",
      "id": "UY"
    },
    {
      "country": "Venezuela",
      "country_code": "VE",
      "name": "Bolívar digital",
      "symbol": "Bs",
      "currency_code": "VES",
      "id": "VE"
    }
  ].sort ((a,b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);

  export function getCurrencyByCountry (id)
  {
        return (currencyList.filter((obj) => obj.country_code.toLowerCase().search(id.toLowerCase()) >= 0 ? true : false))
  }

  export function getCurrencyById (id)
  {
        return (currencyList.filter((obj) => obj.currency_code.toLowerCase().search(id.toLowerCase()) >= 0 ? true : false))
  }
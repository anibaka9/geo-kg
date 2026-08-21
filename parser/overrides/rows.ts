import type { RawLicense } from "../types";

const data: Record<string, Partial<RawLicense>> = {
  "2826-тр": { inn: "", country: "Кыргызстан" },
  "2533 ап": { inn: "ИНН 02712200110249", coordX: "", coordY: "" },
  "4322 ар": { inn: "ИНН 02907201110123", coordX: "", coordY: "", country: "Кыргызстан" },
  "6522 ар": { inn: "ИНН 01012201910225", coordX: "", coordY: "", country: "Китай" },
  "6526 ар": { inn: "ИНН 01012201910225", coordX: "", country: "Китай" },
  "4764 тр": { country: "", status: "Аннулирована. Протокол № 328-Н-17 от 23.06.17г." },
  "4891 тр": { country: "", status: "Аннулирована. Протокол № 87-Н-17 от 22.02.17г." },
  "6637 ар": { country: "", status: "Аннулирована. Протокол от 01-н-2022 от 24.02.22г." },
  "гг-48-00": { region: "Иссык-Кульская область" },
  "гг-53-00": { region: "Чуйская область" },
  "2201-ве": { region: "Джалал-Абадская область" },
  "2814-тр": { region: "Чуйская область" },
  "4614 тр": {
    objectName: "Бешташское месторождение, скважины №9973, 9974 и 9975",
    company: "ЧП Туткучев Талантбек Эмилбекович",
    location: "Таласская область, Таласский район",
    address: "Таласская область, г. Талас, ул. Бердике Баатыра 124",
    founders: "гр. КР Туткучев Талантбек Эмилбекович - 100%",
    country: "Кыргызстан",
  },
  "646-те": {
    licenseValidity: "",
    objectName: "Участок Жийдесай",
    location: "Жалалабатская обл., Аксыйский р-н",
  },
  "823 ме": {
    licenseValidity: "",
    objectName: "",
    company: "Central Asia Metals Group",
  },
  "1548-ве": {
    licenseValidity: "",
    location: "Чуйская обл., Московский р-н",
  },
  "674 ап": {
    licenseValidity: "",
    objectName: "Чаткальская пл.",
    location: "Жалалабатская обл., Чаткальский р-н",
  },
  "1553-ап": {
    licenseValidity: "",
    objectName: "Тегерменская площадь",
    location: "Жалалабатская обл., Токтогульский р-н",
  },
  "1670-се": {
    licenseValidity: "",
  },
  "2918 тр": {
    licenseValidity: "",
    location: "Чуйская обл., Сокулукский р-н",
  },
};
export default data;

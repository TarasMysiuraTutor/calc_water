'use strict';

const I18n = (() => {
  const dict = {
    uk: {
      'meta.title': 'Теплофізичні властивості води · H₂O Calc',
      'header.sub': 'Thermo Calc',
      'header.badge': 'IAPWS-IF97 · 101.325 кПа',
      'hero.eyebrow': 'Термодинамічний калькулятор',
      'hero.title1': 'Теплофізичні',
      'hero.title2': 'властивості води',
      'hero.desc': 'Введіть температуру — отримайте густину, теплоємність, теплопровідність, в\'язкість та інші властивості рідкої води.',
      'input.cardTitle': 'Параметри розрахунку',
      'input.tempLabel': 'Температура',
      'input.pressureLabel': 'Тиск',
      'input.unitsLabel': 'Одиниці',
      'input.calcBtn': 'Розрахувати',
      'input.rangeNote': 'Допустимі діапазони: <b>0 — 800 °C</b> &ensp;·&ensp; <b>0.001 — 100 МПа</b> &ensp;·&ensp; авто: рідина / пара',
      'err.outOfPressure': 'Тиск {val} виходить за межі допустимого діапазону (0.001 — 100 МПа).',
      'results.pressureLabel': 'Тиск',
      'footer.note': 'Розраховано за апроксимаційними формулами стандарту <a href="https://www.iapws.org" target="_blank" rel="noopener">IAPWS-IF97</a>. Похибка < 1% у робочому діапазоні.',
      'footer.copy': 'H₂O Thermo Calc © 2026',
      'footer.version': 'Версія',
      'phase.water': 'Рідка вода',
      'phase.steam': 'Перегріта пара',
      'phase.ice': 'Лід',
      'err.notNumber': 'Будь ласка, введіть числове значення температури.',
      'err.outOfRange': 'Значення {val} виходить за межі допустимого діапазону ({range}).',
      'export.title': 'Експорт результатів',
      'export.csv': 'Завантажити CSV',
      'export.pdf': 'Зберегти як PDF',
      'export.headerProp': 'Властивість',
      'export.headerSymbol': 'Символ',
      'export.headerValue': 'Значення',
      'export.headerUnit': 'Одиниці',
      'export.tempLabel': 'Температура',
      'export.phaseLabel': 'Фаза',
      'export.generated': 'Згенеровано',
      'history.title': 'Історія розрахунків',
      'history.clear': 'Очистити',
      'history.empty': 'Поки що немає збережених розрахунків.',
      'prop.density': 'Густина',
      'prop.cp': 'Питома теплоємність',
      'prop.lambda': 'Теплопровідність',
      'prop.a': 'Температуропровідність',
      'prop.mu': 'Динамічна в\'язкість',
      'prop.nu': 'Кінематична в\'язкість',
      'prop.Pr': 'Число Прандтля',
      'prop.sigma': 'Поверхневий натяг',
      'prop.beta': 'Коеф. об\'ємного розширення',
      'prop.Pv': 'Тиск насиченої пари',
      'prop.h': 'Ентальпія',
      'unit.density': 'кг/м³',
      'unit.cp': 'Дж/(кг·К)',
      'unit.lambda': 'Вт/(м·К)',
      'unit.a': 'м²/с',
      'unit.mu': 'Па·с',
      'unit.nu': 'м²/с',
      'unit.Pr': 'безрозмірне',
      'unit.sigma': 'Н/м',
      'unit.beta': '1/К',
      'unit.Pv': 'кПа',
      'unit.h': 'кДж/кг',
    },
    en: {
      'meta.title': 'Thermophysical properties of water · H₂O Calc',
      'header.sub': 'Thermo Calc',
      'header.badge': 'IAPWS-IF97 · 101.325 kPa',
      'hero.eyebrow': 'Thermodynamic calculator',
      'hero.title1': 'Thermophysical',
      'hero.title2': 'properties of water',
      'hero.desc': 'Enter a temperature to get density, specific heat, thermal conductivity, viscosity and other properties of liquid water.',
      'input.cardTitle': 'Calculation parameters',
      'input.tempLabel': 'Temperature',
      'input.pressureLabel': 'Pressure',
      'input.unitsLabel': 'Units',
      'input.calcBtn': 'Calculate',
      'input.rangeNote': 'Valid ranges: <b>0 — 800 °C</b> &ensp;·&ensp; <b>0.001 — 100 MPa</b> &ensp;·&ensp; auto: liquid / steam',
      'err.outOfPressure': 'Pressure {val} is outside the allowed range (0.001 — 100 MPa).',
      'results.pressureLabel': 'Pressure',
      'footer.note': 'Computed using approximation formulas of the <a href="https://www.iapws.org" target="_blank" rel="noopener">IAPWS-IF97</a> standard. Error < 1% within the working range.',
      'footer.copy': 'H₂O Thermo Calc © 2026',
      'footer.version': 'Version',
      'phase.water': 'Liquid water',
      'phase.steam': 'Superheated steam',
      'phase.ice': 'Ice',
      'err.notNumber': 'Please enter a numeric temperature value.',
      'err.outOfRange': 'Value {val} is outside the allowed range ({range}).',
      'export.title': 'Export results',
      'export.csv': 'Download CSV',
      'export.pdf': 'Save as PDF',
      'export.headerProp': 'Property',
      'export.headerSymbol': 'Symbol',
      'export.headerValue': 'Value',
      'export.headerUnit': 'Unit',
      'export.tempLabel': 'Temperature',
      'export.phaseLabel': 'Phase',
      'export.generated': 'Generated',
      'history.title': 'Calculation history',
      'history.clear': 'Clear',
      'history.empty': 'No saved calculations yet.',
      'prop.density': 'Density',
      'prop.cp': 'Specific heat capacity',
      'prop.lambda': 'Thermal conductivity',
      'prop.a': 'Thermal diffusivity',
      'prop.mu': 'Dynamic viscosity',
      'prop.nu': 'Kinematic viscosity',
      'prop.Pr': 'Prandtl number',
      'prop.sigma': 'Surface tension',
      'prop.beta': 'Volumetric expansion coeff.',
      'prop.Pv': 'Saturation vapor pressure',
      'prop.h': 'Enthalpy',
      'unit.density': 'kg/m³',
      'unit.cp': 'J/(kg·K)',
      'unit.lambda': 'W/(m·K)',
      'unit.a': 'm²/s',
      'unit.mu': 'Pa·s',
      'unit.nu': 'm²/s',
      'unit.Pr': 'dimensionless',
      'unit.sigma': 'N/m',
      'unit.beta': '1/K',
      'unit.Pv': 'kPa',
      'unit.h': 'kJ/kg',
    },
    pl: {
      'meta.title': 'Właściwości termofizyczne wody · H₂O Calc',
      'header.sub': 'Thermo Calc',
      'header.badge': 'IAPWS-IF97 · 101,325 kPa',
      'hero.eyebrow': 'Kalkulator termodynamiczny',
      'hero.title1': 'Właściwości termofizyczne',
      'hero.title2': 'wody',
      'hero.desc': 'Wprowadź temperaturę, aby uzyskać gęstość, ciepło właściwe, przewodność cieplną, lepkość i inne właściwości wody w stanie ciekłym.',
      'input.cardTitle': 'Parametry obliczeń',
      'input.tempLabel': 'Temperatura',
      'input.pressureLabel': 'Ciśnienie',
      'input.unitsLabel': 'Jednostki',
      'input.calcBtn': 'Oblicz',
      'input.rangeNote': 'Dopuszczalne zakresy: <b>0 — 800 °C</b> &ensp;·&ensp; <b>0,001 — 100 MPa</b> &ensp;·&ensp; auto: ciecz / para',
      'err.outOfPressure': 'Ciśnienie {val} wykracza poza dopuszczalny zakres (0,001 — 100 MPa).',
      'results.pressureLabel': 'Ciśnienie',
      'footer.note': 'Obliczone według wzorów aproksymacyjnych standardu <a href="https://www.iapws.org" target="_blank" rel="noopener">IAPWS-IF97</a>. Błąd < 1% w zakresie roboczym.',
      'footer.copy': 'H₂O Thermo Calc © 2026',
      'footer.version': 'Wersja',
      'phase.water': 'Woda ciekła',
      'phase.steam': 'Para przegrzana',
      'phase.ice': 'Lód',
      'err.notNumber': 'Proszę podać liczbową wartość temperatury.',
      'err.outOfRange': 'Wartość {val} wykracza poza dopuszczalny zakres ({range}).',
      'export.title': 'Eksport wyników',
      'export.csv': 'Pobierz CSV',
      'export.pdf': 'Zapisz jako PDF',
      'export.headerProp': 'Właściwość',
      'export.headerSymbol': 'Symbol',
      'export.headerValue': 'Wartość',
      'export.headerUnit': 'Jednostka',
      'export.tempLabel': 'Temperatura',
      'export.phaseLabel': 'Faza',
      'export.generated': 'Wygenerowano',
      'history.title': 'Historia obliczeń',
      'history.clear': 'Wyczyść',
      'history.empty': 'Brak zapisanych obliczeń.',
      'prop.density': 'Gęstość',
      'prop.cp': 'Ciepło właściwe',
      'prop.lambda': 'Przewodność cieplna',
      'prop.a': 'Dyfuzyjność cieplna',
      'prop.mu': 'Lepkość dynamiczna',
      'prop.nu': 'Lepkość kinematyczna',
      'prop.Pr': 'Liczba Prandtla',
      'prop.sigma': 'Napięcie powierzchniowe',
      'prop.beta': 'Wsp. rozszerzalności obj.',
      'prop.Pv': 'Ciśnienie pary nasyconej',
      'prop.h': 'Entalpia',
      'unit.density': 'kg/m³',
      'unit.cp': 'J/(kg·K)',
      'unit.lambda': 'W/(m·K)',
      'unit.a': 'm²/s',
      'unit.mu': 'Pa·s',
      'unit.nu': 'm²/s',
      'unit.Pr': 'bezwymiarowa',
      'unit.sigma': 'N/m',
      'unit.beta': '1/K',
      'unit.Pv': 'kPa',
      'unit.h': 'kJ/kg',
    },
    de: {
      'meta.title': 'Thermophysikalische Eigenschaften von Wasser · H₂O Calc',
      'header.sub': 'Thermo Calc',
      'header.badge': 'IAPWS-IF97 · 101,325 kPa',
      'hero.eyebrow': 'Thermodynamischer Rechner',
      'hero.title1': 'Thermophysikalische',
      'hero.title2': 'Eigenschaften des Wassers',
      'hero.desc': 'Geben Sie eine Temperatur ein, um Dichte, spezifische Wärmekapazität, Wärmeleitfähigkeit, Viskosität und weitere Eigenschaften flüssigen Wassers zu erhalten.',
      'input.cardTitle': 'Berechnungsparameter',
      'input.tempLabel': 'Temperatur',
      'input.pressureLabel': 'Druck',
      'input.unitsLabel': 'Einheiten',
      'input.calcBtn': 'Berechnen',
      'input.rangeNote': 'Zulässige Bereiche: <b>0 — 800 °C</b> &ensp;·&ensp; <b>0,001 — 100 MPa</b> &ensp;·&ensp; auto: Flüssigkeit / Dampf',
      'err.outOfPressure': 'Druck {val} liegt außerhalb des zulässigen Bereichs (0,001 — 100 MPa).',
      'results.pressureLabel': 'Druck',
      'footer.note': 'Berechnet nach Näherungsformeln des Standards <a href="https://www.iapws.org" target="_blank" rel="noopener">IAPWS-IF97</a>. Fehler < 1% im Arbeitsbereich.',
      'footer.copy': 'H₂O Thermo Calc © 2026',
      'footer.version': 'Version',
      'phase.water': 'Flüssiges Wasser',
      'phase.steam': 'Überhitzter Dampf',
      'phase.ice': 'Eis',
      'err.notNumber': 'Bitte geben Sie einen numerischen Temperaturwert ein.',
      'err.outOfRange': 'Wert {val} liegt außerhalb des zulässigen Bereichs ({range}).',
      'export.title': 'Ergebnisse exportieren',
      'export.csv': 'CSV herunterladen',
      'export.pdf': 'Als PDF speichern',
      'export.headerProp': 'Eigenschaft',
      'export.headerSymbol': 'Symbol',
      'export.headerValue': 'Wert',
      'export.headerUnit': 'Einheit',
      'export.tempLabel': 'Temperatur',
      'export.phaseLabel': 'Phase',
      'export.generated': 'Erstellt',
      'history.title': 'Berechnungsverlauf',
      'history.clear': 'Löschen',
      'history.empty': 'Noch keine gespeicherten Berechnungen.',
      'prop.density': 'Dichte',
      'prop.cp': 'Spezifische Wärmekapazität',
      'prop.lambda': 'Wärmeleitfähigkeit',
      'prop.a': 'Temperaturleitfähigkeit',
      'prop.mu': 'Dynamische Viskosität',
      'prop.nu': 'Kinematische Viskosität',
      'prop.Pr': 'Prandtl-Zahl',
      'prop.sigma': 'Oberflächenspannung',
      'prop.beta': 'Volum. Ausdehnungskoeff.',
      'prop.Pv': 'Sättigungsdampfdruck',
      'prop.h': 'Enthalpie',
      'unit.density': 'kg/m³',
      'unit.cp': 'J/(kg·K)',
      'unit.lambda': 'W/(m·K)',
      'unit.a': 'm²/s',
      'unit.mu': 'Pa·s',
      'unit.nu': 'm²/s',
      'unit.Pr': 'dimensionslos',
      'unit.sigma': 'N/m',
      'unit.beta': '1/K',
      'unit.Pv': 'kPa',
      'unit.h': 'kJ/kg',
    },
  };

  const SUPPORTED = ['uk', 'en', 'pl', 'de'];
  const STORAGE_KEY = 'h2o.lang';
  let current = 'uk';
  const listeners = [];

  function detect() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (_) {}
    const nav = (navigator.language || 'uk').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : 'uk';
  }

  function t(key, vars) {
    const tbl = dict[current] || dict.uk;
    let s = tbl[key] != null ? tbl[key] : (dict.uk[key] != null ? dict.uk[key] : key);
    if (vars) {
      for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
    }
    return s;
  }

  function applyToDom() {
    document.documentElement.lang = current;
    document.title = t('meta.title');
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.innerHTML = t(el.getAttribute('data-i18n'));
    });
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    current = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    applyToDom();
    listeners.forEach(fn => { try { fn(lang); } catch (_) {} });
  }

  function onChange(fn) { listeners.push(fn); }
  function get() { return current; }
  function supported() { return SUPPORTED.slice(); }

  function init() {
    current = detect();
    applyToDom();
  }

  return { init, t, setLang, onChange, get, supported };
})();

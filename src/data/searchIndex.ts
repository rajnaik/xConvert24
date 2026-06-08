export interface SearchEntry {
  category: string;
  categoryIcon: string;
  name: string;
  aliases: string[];
  href: string;
  type: 'category' | 'unit' | 'tool' | 'blog';
  popularity: number; // 0-100, higher = more visited
}

export const searchIndex: SearchEntry[] = [
  // ── Weight ──────────────────────────────────────────────────────────────────
  { category: 'Weight', categoryIcon: '⚖️', name: 'Weight Converter', aliases: ['mass', 'weight'], href: '/convert/weight', type: 'category', popularity: 95 },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Kilograms', aliases: ['kg', 'kilogram', 'kilo'], href: '/convert/weight', type: 'unit', popularity: 94 },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Grams', aliases: ['g', 'gram'], href: '/convert/weight', type: 'unit', popularity: 82 },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Milligrams', aliases: ['mg', 'milligram'], href: '/convert/weight', type: 'unit', popularity: 55 },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Pounds', aliases: ['lb', 'lbs', 'pound'], href: '/convert/weight', type: 'unit', popularity: 93 },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Ounces', aliases: ['oz', 'ounce'], href: '/convert/weight', type: 'unit', popularity: 80 },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Stones', aliases: ['st', 'stone'], href: '/convert/weight', type: 'unit', popularity: 50 },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Metric Tonnes', aliases: ['tonne', 't', 'metric ton'], href: '/convert/weight', type: 'unit', popularity: 40 },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Short Tons', aliases: ['ton', 'us ton'], href: '/convert/weight', type: 'unit', popularity: 35 },

  // ── Length ───────────────────────────────────────────────────────────────────
  { category: 'Length', categoryIcon: '📏', name: 'Length Converter', aliases: ['distance', 'length'], href: '/convert/length', type: 'category', popularity: 92 },
  { category: 'Length', categoryIcon: '📏', name: 'Kilometers', aliases: ['km', 'kilometre', 'kilometer'], href: '/convert/length', type: 'unit', popularity: 87 },
  { category: 'Length', categoryIcon: '📏', name: 'Meters', aliases: ['m', 'metre', 'meter'], href: '/convert/length', type: 'unit', popularity: 91 },
  { category: 'Length', categoryIcon: '📏', name: 'Centimeters', aliases: ['cm', 'centimetre', 'centimeter'], href: '/convert/length', type: 'unit', popularity: 81 },
  { category: 'Length', categoryIcon: '📏', name: 'Millimeters', aliases: ['mm', 'millimetre', 'millimeter'], href: '/convert/length', type: 'unit', popularity: 88 },
  { category: 'Length', categoryIcon: '📏', name: 'Miles', aliases: ['mi', 'mile'], href: '/convert/length', type: 'unit', popularity: 85 },
  { category: 'Length', categoryIcon: '📏', name: 'Yards', aliases: ['yd', 'yard'], href: '/convert/length', type: 'unit', popularity: 92 },
  { category: 'Length', categoryIcon: '📏', name: 'Feet', aliases: ['ft', 'foot'], href: '/convert/length', type: 'unit', popularity: 84 },
  { category: 'Length', categoryIcon: '📏', name: 'Inches', aliases: ['in', 'inch'], href: '/convert/length', type: 'unit', popularity: 90 },
  { category: 'Length', categoryIcon: '📏', name: 'Nautical Miles', aliases: ['nmi', 'nautical mile'], href: '/convert/length', type: 'unit', popularity: 75 },

  // ── Temperature ──────────────────────────────────────────────────────────────
  { category: 'Temperature', categoryIcon: '🌡️', name: 'Temperature Converter', aliases: ['temp', 'temperature'], href: '/convert/temperature', type: 'category', popularity: 90 },
  { category: 'Temperature', categoryIcon: '🌡️', name: 'Celsius', aliases: ['°c', 'centigrade', 'celsius'], href: '/convert/temperature', type: 'unit', popularity: 71 },
  { category: 'Temperature', categoryIcon: '🌡️', name: 'Fahrenheit', aliases: ['°f', 'fahrenheit'], href: '/convert/temperature', type: 'unit', popularity: 73 },
  { category: 'Temperature', categoryIcon: '🌡️', name: 'Kelvin', aliases: ['k', 'kelvin'], href: '/convert/temperature', type: 'unit', popularity: 81 },

  // ── Area ─────────────────────────────────────────────────────────────────────
  { category: 'Area', categoryIcon: '📐', name: 'Area Converter', aliases: ['area', 'surface'], href: '/convert/area', type: 'category', popularity: 70 },
  { category: 'Area', categoryIcon: '📐', name: 'Square Meters', aliases: ['m²', 'm2', 'square metre', 'square meter'], href: '/convert/area', type: 'unit', popularity: 58 },
  { category: 'Area', categoryIcon: '📐', name: 'Square Kilometers', aliases: ['km²', 'km2', 'square kilometre'], href: '/convert/area', type: 'unit', popularity: 53 },
  { category: 'Area', categoryIcon: '📐', name: 'Square Feet', aliases: ['ft²', 'ft2', 'square foot', 'square feet'], href: '/convert/area', type: 'unit', popularity: 59 },
  { category: 'Area', categoryIcon: '📐', name: 'Square Inches', aliases: ['in²', 'in2', 'square inch'], href: '/convert/area', type: 'unit', popularity: 69 },
  { category: 'Area', categoryIcon: '📐', name: 'Square Yards', aliases: ['yd²', 'yd2', 'square yard'], href: '/convert/area', type: 'unit', popularity: 68 },
  { category: 'Area', categoryIcon: '📐', name: 'Square Miles', aliases: ['mi²', 'mi2', 'square mile'], href: '/convert/area', type: 'unit', popularity: 51 },
  { category: 'Area', categoryIcon: '📐', name: 'Hectares', aliases: ['ha', 'hectare'], href: '/convert/area', type: 'unit', popularity: 52 },
  { category: 'Area', categoryIcon: '📐', name: 'Acres', aliases: ['ac', 'acre'], href: '/convert/area', type: 'unit', popularity: 53 },

  // ── Volume ───────────────────────────────────────────────────────────────────
  { category: 'Volume', categoryIcon: '🧪', name: 'Volume Converter', aliases: ['volume', 'capacity', 'liquid'], href: '/convert/volume', type: 'category', popularity: 75 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Liters', aliases: ['l', 'litre', 'liter'], href: '/convert/volume', type: 'unit', popularity: 64 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Milliliters', aliases: ['ml', 'millilitre', 'milliliter'], href: '/convert/volume', type: 'unit', popularity: 72 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Cubic Meters', aliases: ['m³', 'm3', 'cubic metre', 'cubic meter'], href: '/convert/volume', type: 'unit', popularity: 64 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Cubic Feet', aliases: ['ft³', 'ft3', 'cubic foot', 'cubic feet'], href: '/convert/volume', type: 'unit', popularity: 70 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Gallons US', aliases: ['gal', 'us gallon', 'gallon'], href: '/convert/volume', type: 'unit', popularity: 57 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Gallons UK', aliases: ['uk gallon', 'imperial gallon'], href: '/convert/volume', type: 'unit', popularity: 59 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Quarts', aliases: ['qt', 'quart'], href: '/convert/volume', type: 'unit', popularity: 72 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Pints', aliases: ['pt', 'pint'], href: '/convert/volume', type: 'unit', popularity: 59 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Cups', aliases: ['cup', 'cups us'], href: '/convert/volume', type: 'unit', popularity: 66 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Fluid Ounces', aliases: ['fl oz', 'floz', 'fluid ounce'], href: '/convert/volume', type: 'unit', popularity: 74 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Tablespoons', aliases: ['tbsp', 'tablespoon'], href: '/convert/volume', type: 'unit', popularity: 75 },
  { category: 'Volume', categoryIcon: '🧪', name: 'Teaspoons', aliases: ['tsp', 'teaspoon'], href: '/convert/volume', type: 'unit', popularity: 65 },

  // ── Speed ────────────────────────────────────────────────────────────────────
  { category: 'Speed', categoryIcon: '💨', name: 'Speed Converter', aliases: ['speed', 'velocity'], href: '/convert/speed', type: 'category', popularity: 68 },
  { category: 'Speed', categoryIcon: '💨', name: 'Kilometers per hour', aliases: ['km/h', 'kmh', 'kph'], href: '/convert/speed', type: 'unit', popularity: 52 },
  { category: 'Speed', categoryIcon: '💨', name: 'Miles per hour', aliases: ['mph', 'miles per hour'], href: '/convert/speed', type: 'unit', popularity: 52 },
  { category: 'Speed', categoryIcon: '💨', name: 'Meters per second', aliases: ['m/s', 'ms', 'metres per second'], href: '/convert/speed', type: 'unit', popularity: 55 },
  { category: 'Speed', categoryIcon: '💨', name: 'Feet per second', aliases: ['ft/s', 'fps', 'feet per second'], href: '/convert/speed', type: 'unit', popularity: 61 },
  { category: 'Speed', categoryIcon: '💨', name: 'Knots', aliases: ['kn', 'knot', 'nautical mph'], href: '/convert/speed', type: 'unit', popularity: 57 },
  { category: 'Speed', categoryIcon: '💨', name: 'Mach', aliases: ['mach', 'mach number', 'speed of sound'], href: '/convert/speed', type: 'unit', popularity: 55 },

  // ── Data Storage ─────────────────────────────────────────────────────────────
  { category: 'Data Storage', categoryIcon: '💾', name: 'Data Storage Converter', aliases: ['data', 'storage', 'digital', 'file size'], href: '/convert/data', type: 'category', popularity: 65 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Bits', aliases: ['b', 'bit'], href: '/convert/data', type: 'unit', popularity: 51 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Bytes', aliases: ['B', 'byte'], href: '/convert/data', type: 'unit', popularity: 51 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Kilobytes', aliases: ['KB', 'kilobyte'], href: '/convert/data', type: 'unit', popularity: 46 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Megabytes', aliases: ['MB', 'megabyte'], href: '/convert/data', type: 'unit', popularity: 57 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Gigabytes', aliases: ['GB', 'gigabyte'], href: '/convert/data', type: 'unit', popularity: 64 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Terabytes', aliases: ['TB', 'terabyte'], href: '/convert/data', type: 'unit', popularity: 62 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Petabytes', aliases: ['PB', 'petabyte'], href: '/convert/data', type: 'unit', popularity: 57 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Kibibytes', aliases: ['KiB', 'kibibyte'], href: '/convert/data', type: 'unit', popularity: 63 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Mebibytes', aliases: ['MiB', 'mebibyte'], href: '/convert/data', type: 'unit', popularity: 50 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Gibibytes', aliases: ['GiB', 'gibibyte'], href: '/convert/data', type: 'unit', popularity: 54 },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Tebibytes', aliases: ['TiB', 'tebibyte'], href: '/convert/data', type: 'unit', popularity: 49 },

  // ── Energy ───────────────────────────────────────────────────────────────────
  { category: 'Energy', categoryIcon: '⚡', name: 'Energy Converter', aliases: ['energy', 'heat', 'work'], href: '/convert/energy', type: 'category', popularity: 50 },
  { category: 'Energy', categoryIcon: '⚡', name: 'Joules', aliases: ['j', 'joule'], href: '/convert/energy', type: 'unit', popularity: 43 },
  { category: 'Energy', categoryIcon: '⚡', name: 'Kilojoules', aliases: ['kj', 'kilojoule'], href: '/convert/energy', type: 'unit', popularity: 46 },
  { category: 'Energy', categoryIcon: '⚡', name: 'Calories', aliases: ['cal', 'calorie'], href: '/convert/energy', type: 'unit', popularity: 45 },
  { category: 'Energy', categoryIcon: '⚡', name: 'Kilocalories', aliases: ['kcal', 'kilocalorie', 'food calorie'], href: '/convert/energy', type: 'unit', popularity: 50 },
  { category: 'Energy', categoryIcon: '⚡', name: 'Kilowatt-hours', aliases: ['kwh', 'kWh', 'kilowatt hour'], href: '/convert/energy', type: 'unit', popularity: 45 },
  { category: 'Energy', categoryIcon: '⚡', name: 'BTU', aliases: ['btu', 'british thermal unit'], href: '/convert/energy', type: 'unit', popularity: 44 },
  { category: 'Energy', categoryIcon: '⚡', name: 'Electronvolts', aliases: ['ev', 'eV', 'electronvolt'], href: '/convert/energy', type: 'unit', popularity: 33 },
  { category: 'Energy', categoryIcon: '⚡', name: 'Megajoules', aliases: ['mj', 'MJ', 'megajoule'], href: '/convert/energy', type: 'unit', popularity: 31 },
  { category: 'Energy', categoryIcon: '⚡', name: 'Watt-hours', aliases: ['wh', 'Wh', 'watt hour'], href: '/convert/energy', type: 'unit', popularity: 47 },

  // ── Pressure ─────────────────────────────────────────────────────────────────
  { category: 'Pressure', categoryIcon: '🔬', name: 'Pressure Converter', aliases: ['pressure'], href: '/convert/pressure', type: 'category', popularity: 48 },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Pascal', aliases: ['pa', 'Pa', 'pascal'], href: '/convert/pressure', type: 'unit', popularity: 31 },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Kilopascal', aliases: ['kpa', 'kPa', 'kilopascal'], href: '/convert/pressure', type: 'unit', popularity: 37 },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Megapascal', aliases: ['mpa', 'MPa', 'megapascal'], href: '/convert/pressure', type: 'unit', popularity: 42 },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Bar', aliases: ['bar'], href: '/convert/pressure', type: 'unit', popularity: 42 },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Millibar', aliases: ['mbar', 'millibar'], href: '/convert/pressure', type: 'unit', popularity: 46 },
  { category: 'Pressure', categoryIcon: '🔬', name: 'PSI', aliases: ['psi', 'pound per square inch', 'lb/in²'], href: '/convert/pressure', type: 'unit', popularity: 29 },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Atmosphere', aliases: ['atm', 'atmosphere'], href: '/convert/pressure', type: 'unit', popularity: 46 },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Torr (mmHg)', aliases: ['torr', 'mmhg', 'mm mercury'], href: '/convert/pressure', type: 'unit', popularity: 30 },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Inches of Mercury', aliases: ['inhg', 'inHg', 'inches mercury'], href: '/convert/pressure', type: 'unit', popularity: 32 },

  // ── Power ────────────────────────────────────────────────────────────────────
  { category: 'Power', categoryIcon: '🔋', name: 'Power Converter', aliases: ['power', 'wattage'], href: '/convert/power', type: 'category', popularity: 45 },
  { category: 'Power', categoryIcon: '🔋', name: 'Watts', aliases: ['w', 'W', 'watt'], href: '/convert/power', type: 'unit', popularity: 37 },
  { category: 'Power', categoryIcon: '🔋', name: 'Kilowatts', aliases: ['kw', 'kW', 'kilowatt'], href: '/convert/power', type: 'unit', popularity: 31 },
  { category: 'Power', categoryIcon: '🔋', name: 'Megawatts', aliases: ['mw', 'MW', 'megawatt'], href: '/convert/power', type: 'unit', popularity: 39 },
  { category: 'Power', categoryIcon: '🔋', name: 'Horsepower', aliases: ['hp', 'horsepower'], href: '/convert/power', type: 'unit', popularity: 43 },
  { category: 'Power', categoryIcon: '🔋', name: 'Metric Horsepower', aliases: ['ps', 'PS', 'metric hp', 'pferdestärke'], href: '/convert/power', type: 'unit', popularity: 35 },
  { category: 'Power', categoryIcon: '🔋', name: 'BTU per hour', aliases: ['btuh', 'BTU/hr', 'btu per hour'], href: '/convert/power', type: 'unit', popularity: 43 },

  // ── Fuel Economy ─────────────────────────────────────────────────────────────
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'Fuel Economy Converter', aliases: ['fuel', 'mpg', 'fuel efficiency', 'gas mileage'], href: '/convert/fuel', type: 'category', popularity: 42 },
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'MPG US', aliases: ['mpg', 'miles per gallon us', 'mpg us'], href: '/convert/fuel', type: 'unit', popularity: 38 },
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'MPG UK', aliases: ['mpg uk', 'imperial mpg', 'miles per gallon uk'], href: '/convert/fuel', type: 'unit', popularity: 30 },
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'L/100km', aliases: ['l/100km', 'liters per 100km', 'litres per 100km'], href: '/convert/fuel', type: 'unit', popularity: 29 },
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'km per Liter', aliases: ['kml', 'km/l', 'kilometres per litre'], href: '/convert/fuel', type: 'unit', popularity: 33 },
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'Miles per Liter', aliases: ['mpl', 'mi/l', 'miles per litre'], href: '/convert/fuel', type: 'unit', popularity: 38 },

  // ── Angle ────────────────────────────────────────────────────────────────────
  { category: 'Angle', categoryIcon: '📐', name: 'Angle Converter', aliases: ['angle', 'rotation'], href: '/convert/angle', type: 'category', popularity: 35 },
  { category: 'Angle', categoryIcon: '📐', name: 'Degrees', aliases: ['deg', '°', 'degree'], href: '/convert/angle', type: 'unit', popularity: 31 },
  { category: 'Angle', categoryIcon: '📐', name: 'Radians', aliases: ['rad', 'radian'], href: '/convert/angle', type: 'unit', popularity: 22 },
  { category: 'Angle', categoryIcon: '📐', name: 'Gradians', aliases: ['grad', 'gradian', 'gon'], href: '/convert/angle', type: 'unit', popularity: 18 },
  { category: 'Angle', categoryIcon: '📐', name: 'Turns', aliases: ['turn', 'revolution', 'full rotation'], href: '/convert/angle', type: 'unit', popularity: 19 },
  { category: 'Angle', categoryIcon: '📐', name: 'Arcminutes', aliases: ['arcmin', "arcminute", "minute of arc"], href: '/convert/angle', type: 'unit', popularity: 22 },
  { category: 'Angle', categoryIcon: '📐', name: 'Arcseconds', aliases: ['arcsec', 'arcsecond', 'second of arc'], href: '/convert/angle', type: 'unit', popularity: 19 },

  // ── Frequency ────────────────────────────────────────────────────────────────
  { category: 'Frequency', categoryIcon: '〰️', name: 'Frequency Converter', aliases: ['frequency', 'cycles', 'oscillation'], href: '/convert/frequency', type: 'category', popularity: 38 },
  { category: 'Frequency', categoryIcon: '〰️', name: 'Hertz', aliases: ['hz', 'Hz', 'hertz', 'cycles per second'], href: '/convert/frequency', type: 'unit', popularity: 30 },
  { category: 'Frequency', categoryIcon: '〰️', name: 'Kilohertz', aliases: ['khz', 'kHz', 'kilohertz'], href: '/convert/frequency', type: 'unit', popularity: 35 },
  { category: 'Frequency', categoryIcon: '〰️', name: 'Megahertz', aliases: ['mhz', 'MHz', 'megahertz'], href: '/convert/frequency', type: 'unit', popularity: 36 },
  { category: 'Frequency', categoryIcon: '〰️', name: 'Gigahertz', aliases: ['ghz', 'GHz', 'gigahertz'], href: '/convert/frequency', type: 'unit', popularity: 28 },
  { category: 'Frequency', categoryIcon: '〰️', name: 'Terahertz', aliases: ['thz', 'THz', 'terahertz'], href: '/convert/frequency', type: 'unit', popularity: 25 },
  { category: 'Frequency', categoryIcon: '〰️', name: 'RPM', aliases: ['rpm', 'revolutions per minute'], href: '/convert/frequency', type: 'unit', popularity: 19 },
  { category: 'Frequency', categoryIcon: '〰️', name: 'RPS', aliases: ['rps', 'revolutions per second'], href: '/convert/frequency', type: 'unit', popularity: 30 },

  // ── Time ─────────────────────────────────────────────────────────────────────
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Time Converter', aliases: ['time', 'duration'], href: '/convert/time', type: 'category', popularity: 60 },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Milliseconds', aliases: ['ms', 'millisecond'], href: '/convert/time', type: 'unit', popularity: 46 },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Seconds', aliases: ['s', 'sec', 'second'], href: '/convert/time', type: 'unit', popularity: 52 },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Minutes', aliases: ['min', 'minute'], href: '/convert/time', type: 'unit', popularity: 60 },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Hours', aliases: ['h', 'hr', 'hour'], href: '/convert/time', type: 'unit', popularity: 59 },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Days', aliases: ['d', 'day'], href: '/convert/time', type: 'unit', popularity: 44 },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Weeks', aliases: ['wk', 'week'], href: '/convert/time', type: 'unit', popularity: 41 },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Months', aliases: ['mo', 'month'], href: '/convert/time', type: 'unit', popularity: 45 },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Years', aliases: ['yr', 'year'], href: '/convert/time', type: 'unit', popularity: 57 },

  // ── Cooking ──────────────────────────────────────────────────────────────────
  { category: 'Cooking', categoryIcon: '🍳', name: 'Cooking Converter', aliases: ['cooking', 'recipe', 'baking'], href: '/convert/cooking', type: 'category', popularity: 72 },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Cups', aliases: ['cup', 'cups us'], href: '/convert/cooking', type: 'unit', popularity: 65 },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Tablespoons', aliases: ['tbsp', 'tablespoon'], href: '/convert/cooking', type: 'unit', popularity: 67 },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Teaspoons', aliases: ['tsp', 'teaspoon'], href: '/convert/cooking', type: 'unit', popularity: 63 },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Fluid Ounces', aliases: ['fl oz', 'floz', 'fluid ounce'], href: '/convert/cooking', type: 'unit', popularity: 56 },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Pints', aliases: ['pt', 'pint'], href: '/convert/cooking', type: 'unit', popularity: 54 },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Quarts', aliases: ['qt', 'quart'], href: '/convert/cooking', type: 'unit', popularity: 69 },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Gallons', aliases: ['gal', 'gallon'], href: '/convert/cooking', type: 'unit', popularity: 66 },

  // ── Number Base ──────────────────────────────────────────────────────────────
  { category: 'Number Base', categoryIcon: '🧮', name: 'Number Base Converter', aliases: ['base', 'binary', 'hex', 'number system'], href: '/convert/base', type: 'category', popularity: 40 },
  { category: 'Number Base', categoryIcon: '🧮', name: 'Decimal', aliases: ['dec', 'base 10', 'decimal number'], href: '/convert/base', type: 'unit', popularity: 30 },
  { category: 'Number Base', categoryIcon: '🧮', name: 'Binary', aliases: ['bin', 'base 2', 'binary number'], href: '/convert/base', type: 'unit', popularity: 35 },
  { category: 'Number Base', categoryIcon: '🧮', name: 'Octal', aliases: ['oct', 'base 8', 'octal number'], href: '/convert/base', type: 'unit', popularity: 32 },
  { category: 'Number Base', categoryIcon: '🧮', name: 'Hexadecimal', aliases: ['hex', 'base 16', 'hexadecimal number'], href: '/convert/base', type: 'unit', popularity: 40 },

  // ── Roman Numerals ───────────────────────────────────────────────────────────
  { category: 'Roman Numerals', categoryIcon: 'Ⅻ', name: 'Roman Numeral Converter', aliases: ['roman', 'numeral', 'roman numeral'], href: '/convert/roman', type: 'category', popularity: 30 },

  // ── Currency ─────────────────────────────────────────────────────────────────
  { category: 'Currency', categoryIcon: '💱', name: 'Currency Converter', aliases: ['currency', 'money', 'exchange rate', 'forex'], href: '/convert/currency', type: 'category', popularity: 88 },
  { category: 'Currency', categoryIcon: '💱', name: 'US Dollar', aliases: ['usd', '$', 'us dollar', 'dollar'], href: '/convert/currency', type: 'unit', popularity: 76 },
  { category: 'Currency', categoryIcon: '💱', name: 'Euro', aliases: ['eur', '€', 'euro'], href: '/convert/currency', type: 'unit', popularity: 81 },
  { category: 'Currency', categoryIcon: '💱', name: 'British Pound', aliases: ['gbp', '£', 'pound', 'sterling'], href: '/convert/currency', type: 'unit', popularity: 79 },
  { category: 'Currency', categoryIcon: '💱', name: 'Japanese Yen', aliases: ['jpy', '¥', 'yen'], href: '/convert/currency', type: 'unit', popularity: 83 },
  { category: 'Currency', categoryIcon: '💱', name: 'Australian Dollar', aliases: ['aud', 'a$', 'australian dollar'], href: '/convert/currency', type: 'unit', popularity: 77 },
  { category: 'Currency', categoryIcon: '💱', name: 'Canadian Dollar', aliases: ['cad', 'c$', 'canadian dollar'], href: '/convert/currency', type: 'unit', popularity: 74 },
  { category: 'Currency', categoryIcon: '💱', name: 'Swiss Franc', aliases: ['chf', 'franc', 'swiss franc'], href: '/convert/currency', type: 'unit', popularity: 77 },
  { category: 'Currency', categoryIcon: '💱', name: 'Chinese Yuan', aliases: ['cny', 'rmb', 'renminbi', 'yuan'], href: '/convert/currency', type: 'unit', popularity: 76 },
  { category: 'Currency', categoryIcon: '💱', name: 'Indian Rupee', aliases: ['inr', '₹', 'rupee'], href: '/convert/currency', type: 'unit', popularity: 84 },
  { category: 'Currency', categoryIcon: '💱', name: 'Mexican Peso', aliases: ['mxn', 'peso', 'mexican peso'], href: '/convert/currency', type: 'unit', popularity: 81 },
  { category: 'Currency', categoryIcon: '💱', name: 'Brazilian Real', aliases: ['brl', 'r$', 'real', 'reais'], href: '/convert/currency', type: 'unit', popularity: 80 },
  { category: 'Currency', categoryIcon: '💱', name: 'Korean Won', aliases: ['krw', '₩', 'won'], href: '/convert/currency', type: 'unit', popularity: 70 },
  { category: 'Currency', categoryIcon: '💱', name: 'Singapore Dollar', aliases: ['sgd', 's$', 'singapore dollar'], href: '/convert/currency', type: 'unit', popularity: 84 },
  { category: 'Currency', categoryIcon: '💱', name: 'Hong Kong Dollar', aliases: ['hkd', 'hk$', 'hong kong dollar'], href: '/convert/currency', type: 'unit', popularity: 70 },
  { category: 'Currency', categoryIcon: '💱', name: 'Norwegian Krone', aliases: ['nok', 'krone', 'norwegian krone'], href: '/convert/currency', type: 'unit', popularity: 70 },
  { category: 'Currency', categoryIcon: '💱', name: 'Swedish Krona', aliases: ['sek', 'krona', 'swedish krona'], href: '/convert/currency', type: 'unit', popularity: 77 },
  { category: 'Currency', categoryIcon: '💱', name: 'New Zealand Dollar', aliases: ['nzd', 'nz$', 'new zealand dollar', 'kiwi dollar'], href: '/convert/currency', type: 'unit', popularity: 70 },

  // ── Media ─────────────────────────────────────────────────────────────────────
  { category: 'Measurements', categoryIcon: '📏', name: 'Online Ruler', aliases: ['ruler', 'measure', 'cm ruler', 'inch ruler', 'screen ruler', 'virtual ruler'], href: '/tools/ruler', type: 'tool', popularity: 65 },
  { category: 'Media', categoryIcon: '🖼️', name: 'Image Converter', aliases: ['image', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'svg', 'convert image', 'resize image'], href: '/tools/image-converter', type: 'tool', popularity: 72 },
  { category: 'Media', categoryIcon: '🎵', name: 'Audio Converter', aliases: ['audio converter', 'wav', 'mp3 converter', 'ogg', 'webm audio', 'convert audio'], href: '/tools/audio-converter', type: 'tool', popularity: 68 },
  { category: 'Media', categoryIcon: '🎥', name: 'Video Converter', aliases: ['video converter', 'mp4', 'webm video', 'convert video', 'trim video', 'resize video'], href: '/tools/video-converter', type: 'tool', popularity: 70 },
  { category: 'Media', categoryIcon: '🎵', name: 'Audio Formats', aliases: ['audio', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'sound', 'music format'], href: '/tools/audio-formats', type: 'tool', popularity: 60 },
  { category: 'Media', categoryIcon: '🎥', name: 'Video Formats', aliases: ['video', 'mp4', 'avi', 'mkv', 'webm', 'mov', 'codec', 'h264', 'h265'], href: '/tools/video-formats', type: 'tool', popularity: 62 },

  // ── Music ─────────────────────────────────────────────────────────────────────
  { category: 'Music', categoryIcon: '🎸', name: 'Guitar Tuner', aliases: ['guitar tuner', 'tuner', 'chromatic tuner', 'pitch', 'frequency', 'tune guitar', 'standard tuning', 'E A D G B E'], href: '/tools/guitar-tuner', type: 'tool', popularity: 68 },

  // ── Beta Plays ──────────────────────────────────────────────────────────────
  { category: 'Beta Plays', categoryIcon: '🦠', name: 'Contagion Tracker', aliases: ['contagion', 'covid', 'ebola', 'hantavirus', 'pandemic', 'disease tracker', 'outbreak', 'virus'], href: '/tools/contagion', type: 'tool', popularity: 65 },

  // ── Tools ────────────────────────────────────────────────────────────────────
  { category: 'Tools', categoryIcon: '🧍', name: 'BMI Calculator', aliases: ['bmi', 'body mass index', 'weight health', 'obesity'], href: '/tools/bmi', type: 'tool', popularity: 78 },
  { category: 'Tools', categoryIcon: '🎨', name: 'Color Picker', aliases: ['color', 'colour', 'rgb', 'hex', 'hsl', 'cmyk', 'color picker'], href: '/tools/color', type: 'tool', popularity: 70 },
  { category: 'Tools', categoryIcon: '🌍', name: 'World Clock', aliases: ['clock', 'world clock', 'time zones', 'city time', 'international time'], href: '/tools/clock', type: 'tool', popularity: 55 },
  { category: 'Tools', categoryIcon: '🔬', name: 'Scientific Calculator', aliases: ['calculator', 'scientific', 'sin cos tan', 'log', 'sqrt', 'trigonometry'], href: '/tools/calculator', type: 'tool', popularity: 75 },
  { category: 'Tools', categoryIcon: '🍽️', name: 'Tip Calculator', aliases: ['tip', 'tip calculator', 'bill split', 'gratuity', 'restaurant'], href: '/tools/tip', type: 'tool', popularity: 62 },
  { category: 'Tools', categoryIcon: '🏷️', name: 'Discount Calculator', aliases: ['discount', 'sale', 'savings', 'percentage off', 'sale price'], href: '/tools/discount', type: 'tool', popularity: 58 },
  { category: 'Tools', categoryIcon: '🏦', name: 'Loan Calculator', aliases: ['loan', 'mortgage', 'interest', 'monthly payment', 'amortization', 'repayment'], href: '/tools/loan', type: 'tool', popularity: 72 },
  { category: 'Tools', categoryIcon: '🎂', name: 'Age Calculator', aliases: ['age', 'birthday', 'date of birth', 'how old'], href: '/tools/age', type: 'tool', popularity: 52 },
  { category: 'Tools', categoryIcon: '📅', name: 'Date Difference', aliases: ['date', 'date difference', 'days between', 'date calculator', 'days until'], href: '/tools/date-diff', type: 'tool', popularity: 48 },
  { category: 'Tools', categoryIcon: '🌐', name: 'Show My IP', aliases: ['ip', 'my ip', 'ip address', 'what is my ip', 'public ip', 'ip lookup', 'ip checker', 'show ip'], href: '/tools/my-ip', type: 'tool', popularity: 60 },

  // ── Blog ─────────────────────────────────────────────────────────────────────
  { category: 'Blog', categoryIcon: '📝', name: 'How to Convert Celsius to Fahrenheit', aliases: ['celsius', 'fahrenheit', 'temperature conversion', 'mental math'], href: '/blog/how-to-convert-celsius-to-fahrenheit', type: 'blog', popularity: 45 },
  { category: 'Blog', categoryIcon: '📝', name: 'Kilograms to Pounds Guide', aliases: ['kg', 'lbs', 'pounds', 'weight conversion'], href: '/blog/how-to-convert-kg-to-lbs', type: 'blog', popularity: 48 },
  { category: 'Blog', categoryIcon: '📝', name: 'How Tall is 6 Feet in CM', aliases: ['height', 'feet', 'cm', 'centimetres'], href: '/blog/how-tall-is-6-feet-in-cm', type: 'blog', popularity: 42 },
  { category: 'Blog', categoryIcon: '📝', name: 'Cups to ML Baking Conversion', aliases: ['cups', 'ml', 'baking', 'recipe', 'millilitres'], href: '/blog/cups-to-ml-baking-conversion', type: 'blog', popularity: 44 },
  { category: 'Blog', categoryIcon: '📝', name: 'Speed Limits Around the World', aliases: ['speed limits', 'km/h', 'mph', 'driving'], href: '/blog/speed-limits-around-the-world', type: 'blog', popularity: 38 },
  { category: 'Blog', categoryIcon: '📝', name: 'Understanding Tyre Pressure: PSI, Bar & kPa', aliases: ['tyre', 'tire', 'psi', 'bar', 'kpa', 'pressure'], href: '/blog/understanding-tire-pressure-psi', type: 'blog', popularity: 36 },
  { category: 'Blog', categoryIcon: '📝', name: 'MB vs GB Explained Simply', aliases: ['mb', 'gb', 'data', 'storage', 'megabyte', 'gigabyte'], href: '/blog/mb-vs-gb-explained-simply', type: 'blog', popularity: 40 },
  { category: 'Blog', categoryIcon: '📝', name: 'World Time Zones Explained', aliases: ['time zones', 'utc', 'daylight saving', 'gmt'], href: '/blog/world-time-zones-explained', type: 'blog', popularity: 37 },
  { category: 'Blog', categoryIcon: '📝', name: 'Horsepower vs Kilowatts', aliases: ['horsepower', 'kilowatt', 'hp', 'kw', 'car power'], href: '/blog/horsepower-vs-kilowatts-cars', type: 'blog', popularity: 35 },
  { category: 'Blog', categoryIcon: '📝', name: 'Driving Distances: km vs Miles', aliases: ['km', 'miles', 'driving', 'road trip'], href: '/blog/driving-distances-km-vs-miles', type: 'blog', popularity: 34 },
  { category: 'Blog', categoryIcon: '📝', name: 'Calories vs Kilocalories', aliases: ['calories', 'kcal', 'kilocalories', 'energy', 'burn'], href: '/blog/calories-vs-kilocalories', type: 'blog', popularity: 38 },
  { category: 'Blog', categoryIcon: '📝', name: 'Gold Weight: Troy Ounces', aliases: ['gold', 'troy', 'ounce', 'precious metals'], href: '/blog/gold-weight-troy-ounces', type: 'blog', popularity: 33 },
  { category: 'Blog', categoryIcon: '📝', name: 'How Much is 1TB of Storage', aliases: ['terabyte', 'tb', '1tb', 'storage space'], href: '/blog/how-much-is-1tb-of-storage', type: 'blog', popularity: 36 },
  { category: 'Blog', categoryIcon: '📝', name: 'Mortgage vs Rent Calculator Guide', aliases: ['mortgage', 'rent', 'buying', 'calculator', 'finance'], href: '/blog/mortgage-vs-rent-calculator-guide', type: 'blog', popularity: 40 },
  { category: 'Blog', categoryIcon: '📝', name: 'Oven Temperatures: °C to °F', aliases: ['oven', 'celsius', 'fahrenheit', 'cooking temperature'], href: '/blog/oven-temperatures-celsius-fahrenheit', type: 'blog', popularity: 43 },
  { category: 'Blog', categoryIcon: '📝', name: 'Internet Speed: Mbps Explained', aliases: ['internet', 'mbps', 'download', 'speed test', 'bandwidth'], href: '/blog/internet-speed-mbps-explained', type: 'blog', popularity: 39 },
  { category: 'Blog', categoryIcon: '📝', name: 'Healthy Weight Loss Rate Per Week', aliases: ['weight loss', 'diet', 'kg per week', 'lbs per week'], href: '/blog/healthy-weight-loss-rate-per-week', type: 'blog', popularity: 37 },
  { category: 'Blog', categoryIcon: '📝', name: 'Fever Temperature: What is Normal', aliases: ['fever', 'body temperature', 'normal temp', '37'], href: '/blog/fever-temperature-what-is-normal', type: 'blog', popularity: 41 },
  { category: 'Blog', categoryIcon: '📝', name: 'Binary vs Decimal Storage Confusion', aliases: ['binary', 'decimal', '931 gb', '1tb', 'storage'], href: '/blog/binary-vs-decimal-storage-confusion', type: 'blog', popularity: 35 },
  { category: 'Blog', categoryIcon: '📝', name: 'Best Time to Exchange Currency', aliases: ['exchange rate', 'currency', 'forex', 'travel money'], href: '/blog/best-time-to-exchange-currency', type: 'blog', popularity: 38 },
  { category: 'Blog', categoryIcon: '📝', name: 'Understanding Cryptocurrency Basics', aliases: ['crypto', 'bitcoin', 'blockchain', 'cryptocurrency'], href: '/blog/understanding-cryptocurrency-basics', type: 'blog', popularity: 40 },
  { category: 'Blog', categoryIcon: '📝', name: 'Feet and Inches to CM Height', aliases: ['feet', 'inches', 'cm', 'height conversion'], href: '/blog/feet-and-inches-to-cm-height', type: 'blog', popularity: 39 },
  { category: 'Blog', categoryIcon: '📝', name: 'How Many Days Until Christmas', aliases: ['christmas', 'countdown', 'days until', 'date calculator'], href: '/blog/how-many-days-until-christmas', type: 'blog', popularity: 34 },
  { category: 'Blog', categoryIcon: '📝', name: 'How Many Litres in a Gallon', aliases: ['litre', 'gallon', 'us gallon', 'uk gallon'], href: '/blog/how-many-liters-in-a-gallon', type: 'blog', popularity: 42 },
  { category: 'Blog', categoryIcon: '📝', name: 'Body Weight: Metric vs Imperial', aliases: ['body weight', 'metric', 'imperial', 'kg', 'lbs'], href: '/blog/body-weight-metric-vs-imperial', type: 'blog', popularity: 33 },
  { category: 'Blog', categoryIcon: '📝', name: 'Wind Speed: Knots to MPH', aliases: ['knots', 'mph', 'wind', 'nautical', 'aviation'], href: '/blog/wind-speed-knots-to-mph', type: 'blog', popularity: 32 },
  { category: 'Blog', categoryIcon: '📝', name: 'Fuel Economy: MPG vs L/100km', aliases: ['mpg', 'l/100km', 'fuel economy', 'gas mileage'], href: '/blog/fuel-economy-mpg-vs-l100km', type: 'blog', popularity: 35 },
  { category: 'Blog', categoryIcon: '📝', name: 'What is a Stone in Weight', aliases: ['stone', 'st', 'uk weight', 'british'], href: '/blog/what-is-a-stone-in-weight', type: 'blog', popularity: 33 },
  { category: 'Blog', categoryIcon: '📝', name: 'Room Measurements: Metres to Feet', aliases: ['room', 'metres', 'feet', 'property', 'measuring'], href: '/blog/room-measurements-meters-to-feet', type: 'blog', popularity: 34 },
  { category: 'Blog', categoryIcon: '📝', name: 'Tablespoon to ML: Medicine Dosing', aliases: ['tablespoon', 'ml', 'medicine', 'dosing', 'liquid'], href: '/blog/tablespoon-to-ml-medicine', type: 'blog', popularity: 36 },
  { category: 'Blog', categoryIcon: '📝', name: 'RGB vs CMYK: When to Use Each', aliases: ['rgb', 'cmyk', 'colour', 'color', 'print', 'screen'], href: '/blog/rgb-vs-cmyk-when-to-use', type: 'blog', popularity: 34 },
  { category: 'Blog', categoryIcon: '📝', name: 'How Far is a Nautical Mile', aliases: ['nautical mile', 'nmi', 'sea', 'navigation'], href: '/blog/how-far-is-a-nautical-mile', type: 'blog', popularity: 31 },
  { category: 'Blog', categoryIcon: '📝', name: 'BMI Limitations: Muscle vs Fat', aliases: ['bmi', 'muscle', 'fat', 'limitations', 'athletes'], href: '/blog/bmi-limitations-muscle-vs-fat', type: 'blog', popularity: 35 },
  { category: 'Blog', categoryIcon: '📝', name: 'Compound Interest Explained', aliases: ['compound interest', 'savings', 'investment', 'money growth'], href: '/blog/compound-interest-explained', type: 'blog', popularity: 38 },
  { category: 'Blog', categoryIcon: '📝', name: 'Miles to Kilometres: For Runners', aliases: ['running', '5k', '10k', 'marathon', 'miles', 'kilometres'], href: '/blog/miles-to-kilometers-running', type: 'blog', popularity: 37 },
  { category: 'Blog', categoryIcon: '📝', name: 'Age Calculator: Exact Days Alive', aliases: ['age', 'days alive', 'birthday', 'exact age'], href: '/blog/age-calculator-exact-days-alive', type: 'blog', popularity: 32 },
  { category: 'Blog', categoryIcon: '📝', name: 'Baby Weight Conversion Chart', aliases: ['baby', 'newborn', 'weight', 'kg', 'lbs', 'oz'], href: '/blog/baby-weight-conversion-chart', type: 'blog', popularity: 36 },
  { category: 'Blog', categoryIcon: '📝', name: 'Pomodoro Technique Timer Guide', aliases: ['pomodoro', 'timer', 'productivity', 'focus', '25 minutes'], href: '/blog/pomodoro-technique-timer-guide', type: 'blog', popularity: 33 },
  { category: 'Blog', categoryIcon: '📝', name: 'US vs UK Pint Difference', aliases: ['pint', 'us pint', 'uk pint', 'imperial', 'beer'], href: '/blog/us-vs-uk-pint-difference', type: 'blog', popularity: 34 },
  { category: 'Blog', categoryIcon: '📝', name: 'Luggage Weight: kg to lbs for Travel', aliases: ['luggage', 'airline', 'travel', 'kg', 'lbs', 'weight limit'], href: '/blog/luggage-weight-kg-to-lbs', type: 'blog', popularity: 38 },
  { category: 'Blog', categoryIcon: '📝', name: 'What is Mach Speed', aliases: ['mach', 'speed of sound', 'supersonic', 'aviation'], href: '/blog/what-is-mach-speed', type: 'blog', popularity: 32 },
  { category: 'Blog', categoryIcon: '📝', name: 'Weather Temperature for Travel', aliases: ['weather', 'travel', 'temperature', 'forecast', 'destination'], href: '/blog/weather-temperature-conversion-travel', type: 'blog', popularity: 33 },
  { category: 'Blog', categoryIcon: '📝', name: 'Hex Colour Codes Explained', aliases: ['hex', 'colour code', 'color code', '#FF5733', 'web design'], href: '/blog/hex-color-codes-explained', type: 'blog', popularity: 35 },
  { category: 'Blog', categoryIcon: '📝', name: 'Millimetres in Engineering', aliases: ['millimetre', 'mm', 'engineering', 'precision', 'manufacturing'], href: '/blog/understanding-millimeters-in-engineering', type: 'blog', popularity: 30 },
  { category: 'Blog', categoryIcon: '📝', name: 'What is Kelvin Temperature', aliases: ['kelvin', 'absolute zero', 'scientific', 'temperature scale'], href: '/blog/what-is-kelvin-temperature', type: 'blog', popularity: 31 },
  { category: 'Blog', categoryIcon: '📝', name: 'Water Intake: Litres Per Day', aliases: ['water', 'hydration', 'litres', 'daily intake', 'health'], href: '/blog/water-intake-liters-per-day', type: 'blog', popularity: 35 },
  { category: 'Blog', categoryIcon: '📝', name: 'BMI: What is a Healthy Weight', aliases: ['bmi', 'healthy weight', 'overweight', 'underweight'], href: '/blog/bmi-what-is-a-healthy-weight', type: 'blog', popularity: 37 },
  { category: 'Blog', categoryIcon: '📝', name: 'Grams to Ounces for Cooking', aliases: ['grams', 'ounces', 'cooking', 'baking', 'recipe'], href: '/blog/grams-to-ounces-for-cooking', type: 'blog', popularity: 38 },
  { category: 'Blog', categoryIcon: '📝', name: 'Freezing & Boiling Points: All Scales', aliases: ['freezing', 'boiling', 'celsius', 'fahrenheit', 'kelvin'], href: '/blog/freezing-and-boiling-points-all-scales', type: 'blog', popularity: 30 },
  { category: 'Blog', categoryIcon: '📝', name: 'How Exchange Rates Work', aliases: ['exchange rate', 'forex', 'currency', 'central bank'], href: '/blog/how-exchange-rates-work', type: 'blog', popularity: 36 },
  { category: 'Blog', categoryIcon: '📝', name: 'Why the World Uses Different Units', aliases: ['metric', 'imperial', 'history', 'measurement systems'], href: '/blog/why-world-uses-different-units', type: 'blog', popularity: 34 },

  // ── NEW: Converters (June 2026) ─────────────────────────────────────────────
  { category: 'Fitness', categoryIcon: '🏃', name: 'Running Pace Converter', aliases: ['new', 'running', 'pace', 'min/km', 'min/mile', 'marathon'], href: '/convert/running-pace', type: 'category', popularity: 60 },
  { category: 'Fitness', categoryIcon: '🚴', name: 'Cycling Speed Converter', aliases: ['new', 'cycling', 'bike', 'speed', 'km/h', 'mph'], href: '/convert/cycling-speed', type: 'category', popularity: 58 },
  { category: 'Finance', categoryIcon: '💎', name: 'Precious Metals Converter', aliases: ['new', 'gold', 'silver', 'platinum', 'troy ounce', 'precious'], href: '/convert/precious-metals', type: 'category', popularity: 62 },
  { category: 'Cooking', categoryIcon: '🔥', name: 'Oven Temperature Converter', aliases: ['new', 'oven', 'gas mark', 'celsius', 'fahrenheit', 'baking'], href: '/convert/oven-temperature', type: 'category', popularity: 65 },
  { category: 'Health', categoryIcon: '🏋️', name: 'Body Weight Percentage Calculator', aliases: ['new', 'body fat', 'lean mass', 'weight percentage', 'fitness'], href: '/convert/body-weight-percentage', type: 'category', popularity: 55 },

  // ── NEW: Blog Posts (June 2026) ─────────────────────────────────────────────
  { category: 'Blog', categoryIcon: '₿', name: 'What Are Satoshis?', aliases: ['new', 'satoshi', 'sats', 'bitcoin unit', 'smallest bitcoin'], href: '/blog/what-are-satoshis', type: 'blog', popularity: 45 },
  { category: 'Blog', categoryIcon: '₿', name: 'Understanding Bitcoin Supply', aliases: ['new', 'bitcoin supply', '21 million', 'scarcity', 'lost coins'], href: '/blog/understanding-bitcoin-supply', type: 'blog', popularity: 44 },
  { category: 'Blog', categoryIcon: '₿', name: 'Bitcoin Halving Explained', aliases: ['new', 'halving', 'block reward', 'mining', 'bitcoin economics'], href: '/blog/bitcoin-halving-explained', type: 'blog', popularity: 46 },
  { category: 'Blog', categoryIcon: '₿', name: 'Bitcoin vs Gold', aliases: ['new', 'bitcoin gold', 'store of value', 'digital gold', 'comparison'], href: '/blog/bitcoin-vs-gold', type: 'blog', popularity: 47 },
];

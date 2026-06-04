export interface SearchEntry {
  category: string;
  categoryIcon: string;
  name: string;
  aliases: string[];
  href: string;
  type: 'category' | 'unit' | 'tool';
}

export const searchIndex: SearchEntry[] = [
  // ── Weight ──────────────────────────────────────────────────────────────────
  { category: 'Weight', categoryIcon: '⚖️', name: 'Weight Converter', aliases: ['mass', 'weight'], href: '/convert/weight', type: 'category' },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Kilograms', aliases: ['kg', 'kilogram', 'kilo'], href: '/convert/weight', type: 'unit' },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Grams', aliases: ['g', 'gram'], href: '/convert/weight', type: 'unit' },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Milligrams', aliases: ['mg', 'milligram'], href: '/convert/weight', type: 'unit' },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Pounds', aliases: ['lb', 'lbs', 'pound'], href: '/convert/weight', type: 'unit' },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Ounces', aliases: ['oz', 'ounce'], href: '/convert/weight', type: 'unit' },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Stones', aliases: ['st', 'stone'], href: '/convert/weight', type: 'unit' },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Metric Tonnes', aliases: ['tonne', 't', 'metric ton'], href: '/convert/weight', type: 'unit' },
  { category: 'Weight', categoryIcon: '⚖️', name: 'Short Tons', aliases: ['ton', 'us ton'], href: '/convert/weight', type: 'unit' },

  // ── Length ───────────────────────────────────────────────────────────────────
  { category: 'Length', categoryIcon: '📏', name: 'Length Converter', aliases: ['distance', 'length'], href: '/convert/length', type: 'category' },
  { category: 'Length', categoryIcon: '📏', name: 'Kilometers', aliases: ['km', 'kilometre', 'kilometer'], href: '/convert/length', type: 'unit' },
  { category: 'Length', categoryIcon: '📏', name: 'Meters', aliases: ['m', 'metre', 'meter'], href: '/convert/length', type: 'unit' },
  { category: 'Length', categoryIcon: '📏', name: 'Centimeters', aliases: ['cm', 'centimetre', 'centimeter'], href: '/convert/length', type: 'unit' },
  { category: 'Length', categoryIcon: '📏', name: 'Millimeters', aliases: ['mm', 'millimetre', 'millimeter'], href: '/convert/length', type: 'unit' },
  { category: 'Length', categoryIcon: '📏', name: 'Miles', aliases: ['mi', 'mile'], href: '/convert/length', type: 'unit' },
  { category: 'Length', categoryIcon: '📏', name: 'Yards', aliases: ['yd', 'yard'], href: '/convert/length', type: 'unit' },
  { category: 'Length', categoryIcon: '📏', name: 'Feet', aliases: ['ft', 'foot'], href: '/convert/length', type: 'unit' },
  { category: 'Length', categoryIcon: '📏', name: 'Inches', aliases: ['in', 'inch'], href: '/convert/length', type: 'unit' },
  { category: 'Length', categoryIcon: '📏', name: 'Nautical Miles', aliases: ['nmi', 'nautical mile'], href: '/convert/length', type: 'unit' },

  // ── Temperature ──────────────────────────────────────────────────────────────
  { category: 'Temperature', categoryIcon: '🌡️', name: 'Temperature Converter', aliases: ['temp', 'temperature'], href: '/convert/temperature', type: 'category' },
  { category: 'Temperature', categoryIcon: '🌡️', name: 'Celsius', aliases: ['°c', 'centigrade', 'celsius'], href: '/convert/temperature', type: 'unit' },
  { category: 'Temperature', categoryIcon: '🌡️', name: 'Fahrenheit', aliases: ['°f', 'fahrenheit'], href: '/convert/temperature', type: 'unit' },
  { category: 'Temperature', categoryIcon: '🌡️', name: 'Kelvin', aliases: ['k', 'kelvin'], href: '/convert/temperature', type: 'unit' },

  // ── Area ─────────────────────────────────────────────────────────────────────
  { category: 'Area', categoryIcon: '📐', name: 'Area Converter', aliases: ['area', 'surface'], href: '/convert/area', type: 'category' },
  { category: 'Area', categoryIcon: '📐', name: 'Square Meters', aliases: ['m²', 'm2', 'square metre', 'square meter'], href: '/convert/area', type: 'unit' },
  { category: 'Area', categoryIcon: '📐', name: 'Square Kilometers', aliases: ['km²', 'km2', 'square kilometre'], href: '/convert/area', type: 'unit' },
  { category: 'Area', categoryIcon: '📐', name: 'Square Feet', aliases: ['ft²', 'ft2', 'square foot', 'square feet'], href: '/convert/area', type: 'unit' },
  { category: 'Area', categoryIcon: '📐', name: 'Square Inches', aliases: ['in²', 'in2', 'square inch'], href: '/convert/area', type: 'unit' },
  { category: 'Area', categoryIcon: '📐', name: 'Square Yards', aliases: ['yd²', 'yd2', 'square yard'], href: '/convert/area', type: 'unit' },
  { category: 'Area', categoryIcon: '📐', name: 'Square Miles', aliases: ['mi²', 'mi2', 'square mile'], href: '/convert/area', type: 'unit' },
  { category: 'Area', categoryIcon: '📐', name: 'Hectares', aliases: ['ha', 'hectare'], href: '/convert/area', type: 'unit' },
  { category: 'Area', categoryIcon: '📐', name: 'Acres', aliases: ['ac', 'acre'], href: '/convert/area', type: 'unit' },

  // ── Volume ───────────────────────────────────────────────────────────────────
  { category: 'Volume', categoryIcon: '🧪', name: 'Volume Converter', aliases: ['volume', 'capacity', 'liquid'], href: '/convert/volume', type: 'category' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Liters', aliases: ['l', 'litre', 'liter'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Milliliters', aliases: ['ml', 'millilitre', 'milliliter'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Cubic Meters', aliases: ['m³', 'm3', 'cubic metre', 'cubic meter'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Cubic Feet', aliases: ['ft³', 'ft3', 'cubic foot', 'cubic feet'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Gallons US', aliases: ['gal', 'us gallon', 'gallon'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Gallons UK', aliases: ['uk gallon', 'imperial gallon'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Quarts', aliases: ['qt', 'quart'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Pints', aliases: ['pt', 'pint'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Cups', aliases: ['cup', 'cups us'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Fluid Ounces', aliases: ['fl oz', 'floz', 'fluid ounce'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Tablespoons', aliases: ['tbsp', 'tablespoon'], href: '/convert/volume', type: 'unit' },
  { category: 'Volume', categoryIcon: '🧪', name: 'Teaspoons', aliases: ['tsp', 'teaspoon'], href: '/convert/volume', type: 'unit' },

  // ── Speed ────────────────────────────────────────────────────────────────────
  { category: 'Speed', categoryIcon: '💨', name: 'Speed Converter', aliases: ['speed', 'velocity'], href: '/convert/speed', type: 'category' },
  { category: 'Speed', categoryIcon: '💨', name: 'Kilometers per hour', aliases: ['km/h', 'kmh', 'kph'], href: '/convert/speed', type: 'unit' },
  { category: 'Speed', categoryIcon: '💨', name: 'Miles per hour', aliases: ['mph', 'miles per hour'], href: '/convert/speed', type: 'unit' },
  { category: 'Speed', categoryIcon: '💨', name: 'Meters per second', aliases: ['m/s', 'ms', 'metres per second'], href: '/convert/speed', type: 'unit' },
  { category: 'Speed', categoryIcon: '💨', name: 'Feet per second', aliases: ['ft/s', 'fps', 'feet per second'], href: '/convert/speed', type: 'unit' },
  { category: 'Speed', categoryIcon: '💨', name: 'Knots', aliases: ['kn', 'knot', 'nautical mph'], href: '/convert/speed', type: 'unit' },
  { category: 'Speed', categoryIcon: '💨', name: 'Mach', aliases: ['mach', 'mach number', 'speed of sound'], href: '/convert/speed', type: 'unit' },

  // ── Data Storage ─────────────────────────────────────────────────────────────
  { category: 'Data Storage', categoryIcon: '💾', name: 'Data Storage Converter', aliases: ['data', 'storage', 'digital', 'file size'], href: '/convert/data', type: 'category' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Bits', aliases: ['b', 'bit'], href: '/convert/data', type: 'unit' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Bytes', aliases: ['B', 'byte'], href: '/convert/data', type: 'unit' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Kilobytes', aliases: ['KB', 'kilobyte'], href: '/convert/data', type: 'unit' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Megabytes', aliases: ['MB', 'megabyte'], href: '/convert/data', type: 'unit' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Gigabytes', aliases: ['GB', 'gigabyte'], href: '/convert/data', type: 'unit' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Terabytes', aliases: ['TB', 'terabyte'], href: '/convert/data', type: 'unit' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Petabytes', aliases: ['PB', 'petabyte'], href: '/convert/data', type: 'unit' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Kibibytes', aliases: ['KiB', 'kibibyte'], href: '/convert/data', type: 'unit' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Mebibytes', aliases: ['MiB', 'mebibyte'], href: '/convert/data', type: 'unit' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Gibibytes', aliases: ['GiB', 'gibibyte'], href: '/convert/data', type: 'unit' },
  { category: 'Data Storage', categoryIcon: '💾', name: 'Tebibytes', aliases: ['TiB', 'tebibyte'], href: '/convert/data', type: 'unit' },

  // ── Energy ───────────────────────────────────────────────────────────────────
  { category: 'Energy', categoryIcon: '⚡', name: 'Energy Converter', aliases: ['energy', 'heat', 'work'], href: '/convert/energy', type: 'category' },
  { category: 'Energy', categoryIcon: '⚡', name: 'Joules', aliases: ['j', 'joule'], href: '/convert/energy', type: 'unit' },
  { category: 'Energy', categoryIcon: '⚡', name: 'Kilojoules', aliases: ['kj', 'kilojoule'], href: '/convert/energy', type: 'unit' },
  { category: 'Energy', categoryIcon: '⚡', name: 'Calories', aliases: ['cal', 'calorie'], href: '/convert/energy', type: 'unit' },
  { category: 'Energy', categoryIcon: '⚡', name: 'Kilocalories', aliases: ['kcal', 'kilocalorie', 'food calorie'], href: '/convert/energy', type: 'unit' },
  { category: 'Energy', categoryIcon: '⚡', name: 'Kilowatt-hours', aliases: ['kwh', 'kWh', 'kilowatt hour'], href: '/convert/energy', type: 'unit' },
  { category: 'Energy', categoryIcon: '⚡', name: 'BTU', aliases: ['btu', 'british thermal unit'], href: '/convert/energy', type: 'unit' },
  { category: 'Energy', categoryIcon: '⚡', name: 'Electronvolts', aliases: ['ev', 'eV', 'electronvolt'], href: '/convert/energy', type: 'unit' },
  { category: 'Energy', categoryIcon: '⚡', name: 'Megajoules', aliases: ['mj', 'MJ', 'megajoule'], href: '/convert/energy', type: 'unit' },
  { category: 'Energy', categoryIcon: '⚡', name: 'Watt-hours', aliases: ['wh', 'Wh', 'watt hour'], href: '/convert/energy', type: 'unit' },

  // ── Pressure ─────────────────────────────────────────────────────────────────
  { category: 'Pressure', categoryIcon: '🔬', name: 'Pressure Converter', aliases: ['pressure'], href: '/convert/pressure', type: 'category' },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Pascal', aliases: ['pa', 'Pa', 'pascal'], href: '/convert/pressure', type: 'unit' },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Kilopascal', aliases: ['kpa', 'kPa', 'kilopascal'], href: '/convert/pressure', type: 'unit' },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Megapascal', aliases: ['mpa', 'MPa', 'megapascal'], href: '/convert/pressure', type: 'unit' },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Bar', aliases: ['bar'], href: '/convert/pressure', type: 'unit' },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Millibar', aliases: ['mbar', 'millibar'], href: '/convert/pressure', type: 'unit' },
  { category: 'Pressure', categoryIcon: '🔬', name: 'PSI', aliases: ['psi', 'pound per square inch', 'lb/in²'], href: '/convert/pressure', type: 'unit' },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Atmosphere', aliases: ['atm', 'atmosphere'], href: '/convert/pressure', type: 'unit' },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Torr (mmHg)', aliases: ['torr', 'mmhg', 'mm mercury'], href: '/convert/pressure', type: 'unit' },
  { category: 'Pressure', categoryIcon: '🔬', name: 'Inches of Mercury', aliases: ['inhg', 'inHg', 'inches mercury'], href: '/convert/pressure', type: 'unit' },

  // ── Power ────────────────────────────────────────────────────────────────────
  { category: 'Power', categoryIcon: '🔋', name: 'Power Converter', aliases: ['power', 'wattage'], href: '/convert/power', type: 'category' },
  { category: 'Power', categoryIcon: '🔋', name: 'Watts', aliases: ['w', 'W', 'watt'], href: '/convert/power', type: 'unit' },
  { category: 'Power', categoryIcon: '🔋', name: 'Kilowatts', aliases: ['kw', 'kW', 'kilowatt'], href: '/convert/power', type: 'unit' },
  { category: 'Power', categoryIcon: '🔋', name: 'Megawatts', aliases: ['mw', 'MW', 'megawatt'], href: '/convert/power', type: 'unit' },
  { category: 'Power', categoryIcon: '🔋', name: 'Horsepower', aliases: ['hp', 'horsepower'], href: '/convert/power', type: 'unit' },
  { category: 'Power', categoryIcon: '🔋', name: 'Metric Horsepower', aliases: ['ps', 'PS', 'metric hp', 'pferdestärke'], href: '/convert/power', type: 'unit' },
  { category: 'Power', categoryIcon: '🔋', name: 'BTU per hour', aliases: ['btuh', 'BTU/hr', 'btu per hour'], href: '/convert/power', type: 'unit' },

  // ── Fuel Economy ─────────────────────────────────────────────────────────────
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'Fuel Economy Converter', aliases: ['fuel', 'mpg', 'fuel efficiency', 'gas mileage'], href: '/convert/fuel', type: 'category' },
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'MPG US', aliases: ['mpg', 'miles per gallon us', 'mpg us'], href: '/convert/fuel', type: 'unit' },
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'MPG UK', aliases: ['mpg uk', 'imperial mpg', 'miles per gallon uk'], href: '/convert/fuel', type: 'unit' },
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'L/100km', aliases: ['l/100km', 'liters per 100km', 'litres per 100km'], href: '/convert/fuel', type: 'unit' },
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'km per Liter', aliases: ['kml', 'km/l', 'kilometres per litre'], href: '/convert/fuel', type: 'unit' },
  { category: 'Fuel Economy', categoryIcon: '⛽', name: 'Miles per Liter', aliases: ['mpl', 'mi/l', 'miles per litre'], href: '/convert/fuel', type: 'unit' },

  // ── Angle ────────────────────────────────────────────────────────────────────
  { category: 'Angle', categoryIcon: '📐', name: 'Angle Converter', aliases: ['angle', 'rotation'], href: '/convert/angle', type: 'category' },
  { category: 'Angle', categoryIcon: '📐', name: 'Degrees', aliases: ['deg', '°', 'degree'], href: '/convert/angle', type: 'unit' },
  { category: 'Angle', categoryIcon: '📐', name: 'Radians', aliases: ['rad', 'radian'], href: '/convert/angle', type: 'unit' },
  { category: 'Angle', categoryIcon: '📐', name: 'Gradians', aliases: ['grad', 'gradian', 'gon'], href: '/convert/angle', type: 'unit' },
  { category: 'Angle', categoryIcon: '📐', name: 'Turns', aliases: ['turn', 'revolution', 'full rotation'], href: '/convert/angle', type: 'unit' },
  { category: 'Angle', categoryIcon: '📐', name: 'Arcminutes', aliases: ['arcmin', "arcminute", "minute of arc"], href: '/convert/angle', type: 'unit' },
  { category: 'Angle', categoryIcon: '📐', name: 'Arcseconds', aliases: ['arcsec', 'arcsecond', 'second of arc'], href: '/convert/angle', type: 'unit' },

  // ── Frequency ────────────────────────────────────────────────────────────────
  { category: 'Frequency', categoryIcon: '〰️', name: 'Frequency Converter', aliases: ['frequency', 'cycles', 'oscillation'], href: '/convert/frequency', type: 'category' },
  { category: 'Frequency', categoryIcon: '〰️', name: 'Hertz', aliases: ['hz', 'Hz', 'hertz', 'cycles per second'], href: '/convert/frequency', type: 'unit' },
  { category: 'Frequency', categoryIcon: '〰️', name: 'Kilohertz', aliases: ['khz', 'kHz', 'kilohertz'], href: '/convert/frequency', type: 'unit' },
  { category: 'Frequency', categoryIcon: '〰️', name: 'Megahertz', aliases: ['mhz', 'MHz', 'megahertz'], href: '/convert/frequency', type: 'unit' },
  { category: 'Frequency', categoryIcon: '〰️', name: 'Gigahertz', aliases: ['ghz', 'GHz', 'gigahertz'], href: '/convert/frequency', type: 'unit' },
  { category: 'Frequency', categoryIcon: '〰️', name: 'Terahertz', aliases: ['thz', 'THz', 'terahertz'], href: '/convert/frequency', type: 'unit' },
  { category: 'Frequency', categoryIcon: '〰️', name: 'RPM', aliases: ['rpm', 'revolutions per minute'], href: '/convert/frequency', type: 'unit' },
  { category: 'Frequency', categoryIcon: '〰️', name: 'RPS', aliases: ['rps', 'revolutions per second'], href: '/convert/frequency', type: 'unit' },

  // ── Time ─────────────────────────────────────────────────────────────────────
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Time Converter', aliases: ['time', 'duration'], href: '/convert/time', type: 'category' },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Milliseconds', aliases: ['ms', 'millisecond'], href: '/convert/time', type: 'unit' },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Seconds', aliases: ['s', 'sec', 'second'], href: '/convert/time', type: 'unit' },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Minutes', aliases: ['min', 'minute'], href: '/convert/time', type: 'unit' },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Hours', aliases: ['h', 'hr', 'hour'], href: '/convert/time', type: 'unit' },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Days', aliases: ['d', 'day'], href: '/convert/time', type: 'unit' },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Weeks', aliases: ['wk', 'week'], href: '/convert/time', type: 'unit' },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Months', aliases: ['mo', 'month'], href: '/convert/time', type: 'unit' },
  { category: 'Time Units', categoryIcon: '⏱️', name: 'Years', aliases: ['yr', 'year'], href: '/convert/time', type: 'unit' },

  // ── Cooking ──────────────────────────────────────────────────────────────────
  { category: 'Cooking', categoryIcon: '🍳', name: 'Cooking Converter', aliases: ['cooking', 'recipe', 'baking'], href: '/convert/cooking', type: 'category' },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Cups', aliases: ['cup', 'cups us'], href: '/convert/cooking', type: 'unit' },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Tablespoons', aliases: ['tbsp', 'tablespoon'], href: '/convert/cooking', type: 'unit' },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Teaspoons', aliases: ['tsp', 'teaspoon'], href: '/convert/cooking', type: 'unit' },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Fluid Ounces', aliases: ['fl oz', 'floz', 'fluid ounce'], href: '/convert/cooking', type: 'unit' },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Pints', aliases: ['pt', 'pint'], href: '/convert/cooking', type: 'unit' },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Quarts', aliases: ['qt', 'quart'], href: '/convert/cooking', type: 'unit' },
  { category: 'Cooking', categoryIcon: '🍳', name: 'Gallons', aliases: ['gal', 'gallon'], href: '/convert/cooking', type: 'unit' },

  // ── Number Base ──────────────────────────────────────────────────────────────
  { category: 'Number Base', categoryIcon: '🧮', name: 'Number Base Converter', aliases: ['base', 'binary', 'hex', 'number system'], href: '/convert/base', type: 'category' },
  { category: 'Number Base', categoryIcon: '🧮', name: 'Decimal', aliases: ['dec', 'base 10', 'decimal number'], href: '/convert/base', type: 'unit' },
  { category: 'Number Base', categoryIcon: '🧮', name: 'Binary', aliases: ['bin', 'base 2', 'binary number'], href: '/convert/base', type: 'unit' },
  { category: 'Number Base', categoryIcon: '🧮', name: 'Octal', aliases: ['oct', 'base 8', 'octal number'], href: '/convert/base', type: 'unit' },
  { category: 'Number Base', categoryIcon: '🧮', name: 'Hexadecimal', aliases: ['hex', 'base 16', 'hexadecimal number'], href: '/convert/base', type: 'unit' },

  // ── Roman Numerals ───────────────────────────────────────────────────────────
  { category: 'Roman Numerals', categoryIcon: 'Ⅻ', name: 'Roman Numeral Converter', aliases: ['roman', 'numeral', 'roman numeral'], href: '/convert/roman', type: 'category' },

  // ── Currency ─────────────────────────────────────────────────────────────────
  { category: 'Currency', categoryIcon: '💱', name: 'Currency Converter', aliases: ['currency', 'money', 'exchange rate', 'forex'], href: '/convert/currency', type: 'category' },
  { category: 'Currency', categoryIcon: '💱', name: 'US Dollar', aliases: ['usd', '$', 'us dollar', 'dollar'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Euro', aliases: ['eur', '€', 'euro'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'British Pound', aliases: ['gbp', '£', 'pound', 'sterling'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Japanese Yen', aliases: ['jpy', '¥', 'yen'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Australian Dollar', aliases: ['aud', 'a$', 'australian dollar'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Canadian Dollar', aliases: ['cad', 'c$', 'canadian dollar'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Swiss Franc', aliases: ['chf', 'franc', 'swiss franc'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Chinese Yuan', aliases: ['cny', 'rmb', 'renminbi', 'yuan'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Indian Rupee', aliases: ['inr', '₹', 'rupee'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Mexican Peso', aliases: ['mxn', 'peso', 'mexican peso'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Brazilian Real', aliases: ['brl', 'r$', 'real', 'reais'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Korean Won', aliases: ['krw', '₩', 'won'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Singapore Dollar', aliases: ['sgd', 's$', 'singapore dollar'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Hong Kong Dollar', aliases: ['hkd', 'hk$', 'hong kong dollar'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Norwegian Krone', aliases: ['nok', 'krone', 'norwegian krone'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'Swedish Krona', aliases: ['sek', 'krona', 'swedish krona'], href: '/convert/currency', type: 'unit' },
  { category: 'Currency', categoryIcon: '💱', name: 'New Zealand Dollar', aliases: ['nzd', 'nz$', 'new zealand dollar', 'kiwi dollar'], href: '/convert/currency', type: 'unit' },

  // ── Tools ────────────────────────────────────────────────────────────────────
  { category: 'Tools', categoryIcon: '🧍', name: 'BMI Calculator', aliases: ['bmi', 'body mass index', 'weight health', 'obesity'], href: '/tools/bmi', type: 'tool' },
  { category: 'Tools', categoryIcon: '🎨', name: 'Color Picker', aliases: ['color', 'colour', 'rgb', 'hex', 'hsl', 'cmyk', 'color picker'], href: '/tools/color', type: 'tool' },
  { category: 'Tools', categoryIcon: '🌍', name: 'World Clock', aliases: ['clock', 'world clock', 'time zones', 'city time', 'international time'], href: '/tools/clock', type: 'tool' },
  { category: 'Tools', categoryIcon: '🔬', name: 'Scientific Calculator', aliases: ['calculator', 'scientific', 'sin cos tan', 'log', 'sqrt', 'trigonometry'], href: '/tools/calculator', type: 'tool' },
  { category: 'Tools', categoryIcon: '🍽️', name: 'Tip Calculator', aliases: ['tip', 'tip calculator', 'bill split', 'gratuity', 'restaurant'], href: '/tools/tip', type: 'tool' },
  { category: 'Tools', categoryIcon: '🏷️', name: 'Discount Calculator', aliases: ['discount', 'sale', 'savings', 'percentage off', 'sale price'], href: '/tools/discount', type: 'tool' },
  { category: 'Tools', categoryIcon: '🏦', name: 'Loan Calculator', aliases: ['loan', 'mortgage', 'interest', 'monthly payment', 'amortization', 'repayment'], href: '/tools/loan', type: 'tool' },
  { category: 'Tools', categoryIcon: '🎂', name: 'Age Calculator', aliases: ['age', 'birthday', 'date of birth', 'how old'], href: '/tools/age', type: 'tool' },
  { category: 'Tools', categoryIcon: '📅', name: 'Date Difference', aliases: ['date', 'date difference', 'days between', 'date calculator', 'days until'], href: '/tools/date-diff', type: 'tool' },
];

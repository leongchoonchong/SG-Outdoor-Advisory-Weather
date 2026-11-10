import { ActivityAdvice, ActivityType, CurrentWeatherData, AirQualityData } from '../types/weather';

export function calculateActivityAdvisories(
  current: CurrentWeatherData,
  airQuality: AirQualityData,
  imageMap: { running: string; hiking: string; cycling: string }
): ActivityAdvice[] {
  const { temp, rh, heatIndex, wbgt, heatStressLevel, uvIndex } = current;
  const psi = airQuality.psi.overall;
  const pm25 = airQuality.pm25.oneHourly;

  // Helper to determine status and score
  const evaluate = (
    exertionLevel: 'low' | 'moderate' | 'high',
    isCanopyShaded: boolean,
    isWaterCooled: boolean
  ) => {
    let score = 100;
    const deductions: string[] = [];

    // WBGT Heat Stress penalty
    if (wbgt >= 33 || heatIndex >= 40) {
      const penalty = exertionLevel === 'high' ? 45 : exertionLevel === 'moderate' ? 35 : 20;
      score -= penalty;
      deductions.push('High WBGT Heat Stress (≥33°C): extreme thermal exhaustion risk');
    } else if (wbgt >= 31 || heatIndex >= 34) {
      const penalty = exertionLevel === 'high' ? 25 : exertionLevel === 'moderate' ? 18 : 10;
      score -= penalty;
      deductions.push('Moderate WBGT Heat Stress (31-33°C): active cooling required');
    }

    // High humidity penalty on evaporative cooling
    if (rh > 80 && temp > 30) {
      score -= 10;
      deductions.push('Extreme tropical humidity (>80%) impairs sweat evaporation');
    }

    // Air quality (PSI & PM2.5)
    if (psi > 100 || pm25 > 55) {
      const penalty = exertionLevel === 'high' ? 35 : 20;
      score -= penalty;
      deductions.push('Unhealthy Air Quality (PSI >100 or PM2.5 >55µg/m³)');
    } else if (psi > 50 || pm25 > 25) {
      const penalty = exertionLevel === 'high' ? 12 : 5;
      score -= penalty;
      deductions.push('Moderate Air Quality: sensitive individuals may experience airway tightness');
    }

    // UV Index penalty (if not shaded canopy or water sport with sun)
    if (uvIndex >= 8 && !isCanopyShaded) {
      score -= 10;
      deductions.push('Very High/Extreme UV (≥8): rapid sunburn in 15-20 min');
    }

    if (isCanopyShaded) {
      score = Math.min(100, score + 8); // canopy mitigates direct radiant solar load
    }
    if (isWaterCooled) {
      score = Math.min(100, score + 6); // water contact mitigates thermal strain
    }

    score = Math.max(10, Math.min(100, score));

    let status: 'Optimal' | 'Caution' | 'Unfavourable' = 'Optimal';
    if (score < 50 || wbgt >= 33 || psi > 100) {
      status = 'Unfavourable';
    } else if (score < 75 || wbgt >= 31 || psi > 50 || uvIndex >= 8) {
      status = 'Caution';
    }

    return { score, status, deductions };
  };

  const runningEval = evaluate('high', false, false);
  const cyclingEval = evaluate('moderate', false, false);
  const hikingEval = evaluate('moderate', true, false);
  const waterSportsEval = evaluate('moderate', false, true);
  const courtSportsEval = evaluate('high', false, false);
  const familyEval = evaluate('low', false, false);
  const seniorEval = evaluate('low', true, false);

  const advisories: ActivityAdvice[] = [
    {
      activityId: 'running',
      title: 'Running & Marathon Training',
      category: 'High Cardiovascular Exertion',
      status: runningEval.status,
      safetyScore: runningEval.score,
      summary: runningEval.status === 'Optimal'
        ? 'Favourable conditions for sustained aerobic running with standard hydration.'
        : runningEval.status === 'Caution'
        ? 'Elevated heat load. Lower planned target pace by 15-20s/km and shorten long runs.'
        : 'High heat stress threshold reached. Avoid tempo runs or long endurance training outdoors.',
      image: imageMap.running,
      hydrationPlan: wbgt >= 31
        ? 'Drink 250-350ml cold electrolyte fluid every 15 minutes. Pre-hydrate with 500ml 1 hour prior.'
        : 'Drink 200-250ml water every 20 minutes.',
      workRestRatio: wbgt >= 33
        ? 'Not recommended. Maximum 15-min light jog followed by immediate active cooling.'
        : wbgt >= 31
        ? '40 min running : 10 min shaded walking/rest.'
        : 'Standard training intervals with scheduled fluid stations.',
      clothingTip: 'Lightweight, ultra-breathable moisture-wicking singlet, anti-chafing balm, running cap.',
      uvAdvice: uvIndex >= 8 ? 'High UV danger. UV400 sunglasses and water-resistant SPF50+ required.' : 'Standard UV protection.',
      airQualityImpact: psi > 50 ? `PSI is ${psi}. Deep inhalation during running may increase lung irritation.` : 'Air quality is clear and optimal for deep lung capacity.',
      heatStressImpact: `WBGT is ${wbgt}°C (${heatStressLevel} stress). Internal body temp rises rapidly due to ${rh}% humidity.`,
      bestHours: '06:00 - 08:30 AM or 18:30 - 21:00 PM',
      indoorAlternative: 'Indoor treadmill running in air-conditioned gym or sheltered track at Singapore Sports Hub.',
    },
    {
      activityId: 'cycling',
      title: 'Cycling & PCN Touring',
      category: 'Continuous Aerobic / Convective Cooling',
      status: cyclingEval.status,
      safetyScore: cyclingEval.score,
      summary: cyclingEval.status === 'Optimal'
        ? 'Great conditions for park connector touring and road cycling. Convective airflow aids cooling.'
        : cyclingEval.status === 'Caution'
        ? 'Convective airflow provides relief while rolling, but core temperature spikes quickly when stopped.'
        : 'Extreme radiant heat from tarmac. Riding at midday carries serious risk of thermal exhaustion.',
      image: imageMap.cycling,
      hydrationPlan: wbgt >= 31
        ? 'Carry 2 bidons (at least 1.5L) with isotonic electrolytes; consume 600-800ml per hour.'
        : 'Carry 1-2 water bottles; drink every 20-25 minutes.',
      workRestRatio: wbgt >= 31 ? 'Ride 45 mins : stop at shaded PCN pavilion for 10 mins.' : 'Continuous steady riding as tolerated.',
      clothingTip: 'Mesh cycling jersey, UV arm sleeves, photochromic cycling glasses, ventilated helmet.',
      uvAdvice: 'Sustained exposure on open road/PCN bridges. Apply broad-spectrum sunscreen to neck, ears, and thighs.',
      airQualityImpact: psi > 50 ? 'Moderate particulate levels; consider reduced cadence if sensitive.' : 'Clear air on coastal and park corridors.',
      heatStressImpact: `Heat index feels like ${heatIndex}°C. Thermal asphalt radiation increases ground-level heat.`,
      bestHours: '06:30 - 09:30 AM or 17:30 - 20:30 PM',
      indoorAlternative: 'Smart indoor bike trainer (Zwift) or spin studio workout.',
    },
    {
      activityId: 'hiking',
      title: 'Hiking & Nature Trail Walks',
      category: 'Forested Canopy / High Ambient Humidity',
      status: hikingEval.status,
      safetyScore: hikingEval.score,
      summary: hikingEval.status === 'Optimal'
        ? 'Ideal forest canopy conditions at MacRitchie, Bukit Timah, or Southern Ridges.'
        : hikingEval.status === 'Caution'
        ? 'Rainforest canopy shields direct UV, but stagnant jungle air traps tropical humidity. Pace steadily.'
        : 'Stifling rainforest conditions. High heat index with little wind inside dense jungle trails.',
      image: imageMap.hiking,
      hydrationPlan: 'Carry minimum 1.5L backpack reservoir. Sip small amounts continuously every 10-15 minutes.',
      workRestRatio: 'Take a 3-5 minute breathing rest every 2-3km at sheltered trail gazebos.',
      clothingTip: 'Loose quick-dry hiking apparel, breathable trail runners, insect repellent with DEET/Picaridin.',
      uvAdvice: 'Tree foliage provides 70-85% solar block, but open ridges (Henderson Waves, TreeTop Walk) need hats.',
      airQualityImpact: 'Protected jungle trees filter particulates; forest air generally tests cleaner than roadside.',
      heatStressImpact: `WBGT is ${wbgt}°C. Still air in the valley can cause heavy sweating and rapid salt depletion.`,
      bestHours: '07:00 - 10:30 AM or 16:30 - 18:45 PM',
      indoorAlternative: 'Cloud Forest and Flower Dome at Gardens by the Bay (fully climate-controlled 23°C-25°C).',
    },
    {
      activityId: 'water_sports',
      title: 'Water Sports & Beach Recreation',
      category: 'Marine Environment & Solar Reflection',
      status: waterSportsEval.status,
      safetyScore: waterSportsEval.score,
      summary: waterSportsEval.status === 'Optimal'
        ? 'Inviting conditions for kayaking, stand-up paddleboarding, and open water swimming.'
        : waterSportsEval.status === 'Caution'
        ? 'Water provides conductive cooling, but double UV exposure from surface reflection requires vigilance.'
        : 'Lightning / sudden thunderstorm risk or high heat load on open watercraft.',
      hydrationPlan: 'Do not rely on ocean water coolness to gauge thirst. Drink 200ml fresh water every 20-30 min.',
      workRestRatio: 'Alternate paddling intervals with floating rest in shade.',
      clothingTip: 'UPF50+ rash guard, water shoes, polarized floating sunglasses with retainer strap.',
      uvAdvice: `Current UV Index ${uvIndex}. Water reflection amplifies UV by up to 25%. Reapply water-resistant sunscreen.`,
      airQualityImpact: 'Coastal sea breeze provides good ventilation and dilution of urban emissions.',
      heatStressImpact: 'Skin feels cooler in water, masking core body heat buildup.',
      bestHours: '08:00 - 11:00 AM or 16:00 - 19:00 PM',
      indoorAlternative: 'Sheltered municipal Olympic pool (e.g. OCBC Aquatic Centre).',
    },
    {
      activityId: 'court_sports',
      title: 'Court & Field Sports (Football, Tennis, Basketball)',
      category: 'Intermittent High Intensity on Hard Surfaces',
      status: courtSportsEval.status,
      safetyScore: courtSportsEval.score,
      summary: courtSportsEval.status === 'Optimal'
        ? 'Excellent for team scrimmages, tennis rallies, and football drills.'
        : courtSportsEval.status === 'Caution'
        ? 'Hard courts absorb intense heat. Implement mandatory 5-minute hydration breaks between sets/halves.'
        : 'High thermal strain on court. Reschedule outdoor matches to evening or under covered arenas.',
      hydrationPlan: 'Chilled electrolyte beverage mandatory. Pre-load with 300ml 30 mins prior.',
      workRestRatio: wbgt >= 31 ? '15 min intense play : 5 min shaded rest.' : 'Standard match rotations.',
      clothingTip: 'White or light-colored breathable tennis/football kit, sweat wristbands, cooling towel.',
      uvAdvice: 'Open court exposure. Wide-brim visor or cap and sports sunscreen that does not sting eyes.',
      airQualityImpact: psi > 50 ? 'Sprint bursts tax respiratory tract; shorten match duration.' : 'Good air conditions for high ventilatory rate.',
      heatStressImpact: `Surface asphalt/acrylic court temperature can reach 45°C+. Heat index feels like ${heatIndex}°C.`,
      bestHours: '07:00 - 09:30 AM or after 18:00 PM (under floodlights)',
      indoorAlternative: 'Indoor sports halls at ActiveSG sport centers or sheltered futsal pitches.',
    },
    {
      activityId: 'family_outing',
      title: 'Family & Toddler Playground Outings',
      category: 'Vulnerable Population / Thermoregulation',
      status: familyEval.status,
      safetyScore: familyEval.score,
      summary: familyEval.status === 'Optimal'
        ? 'Comfortable for playground visits, baby stroller walks, and picnic lawns.'
        : familyEval.status === 'Caution'
        ? 'Young children heat up 3-5 times faster than adults. Check metal playground slides for burns.'
        : 'Excessive thermal load for infants and toddlers. Limit outdoor play to sheltered water play areas.',
      hydrationPlan: 'Offer frequent water sips or chilled fruit slices every 15-20 minutes, even if children don’t ask.',
      workRestRatio: '20 minutes active play followed by cool shaded rest with handheld fans.',
      clothingTip: 'Loose breathable cotton or bamboo fabrics, wide-brim sun hats with neck flaps, sunglasses.',
      uvAdvice: `UV is ${uvIndex}. Delicate child skin burns quickly; apply mineral-based broad-spectrum SPF50+.`,
      airQualityImpact: psi > 50 ? 'Keep play low-key; avoid vigorous running on haze days.' : 'Good outdoor air quality for family play.',
      heatStressImpact: 'Children sweat less efficiently and have higher metabolic heat production per kilogram.',
      bestHours: '08:00 - 10:00 AM or 17:00 - 19:30 PM',
      indoorAlternative: 'Indoor soft play spaces, Jewel Changi Canopy Park, or science center indoor exhibits.',
    },
    {
      activityId: 'senior_walking',
      title: 'Senior Citizen Walking & Tai Chi',
      category: 'Low Impact / Cardiovascular Preservation',
      status: seniorEval.status,
      safetyScore: seniorEval.score,
      summary: seniorEval.status === 'Optimal'
        ? 'Gentle, refreshing conditions for brisk walking, park socializing, and morning Tai Chi.'
        : seniorEval.status === 'Caution'
        ? 'Seniors have diminished thirst cues. Walk exclusively along shaded park corridors with benches.'
        : 'High heat stress. Older adults on antihypertensive/cardiac medications should stay in climate-controlled areas.',
      hydrationPlan: 'Drink 150ml room temperature or cool water every 20 minutes on a timed schedule.',
      workRestRatio: 'Walk 15-20 mins : sit at shaded bench for 5 mins.',
      clothingTip: 'Light-colored, loose linen or cotton attire, supportive walking shoes with cushioned soles.',
      uvAdvice: 'Wear a wide-brim UV hat and polarized sunglasses to protect cataracts and aging retinas.',
      airQualityImpact: psi > 50 ? 'Seniors with asthma or heart conditions should minimize outdoor physical exertion.' : 'Clear air safe for normal walking routines.',
      heatStressImpact: `WBGT is ${wbgt}°C. Heat strain puts extra workload on the circulatory system.`,
      bestHours: '06:30 - 08:30 AM or 18:00 - 19:30 PM',
      indoorAlternative: 'Mall walking at air-conditioned shopping centers or community club indoor studios.',
    },
  ];

  return advisories;
}

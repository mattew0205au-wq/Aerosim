-- 全球機場表
CREATE TABLE airports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iata_code VARCHAR(3) UNIQUE NOT NULL,
    icao_code VARCHAR(4) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    runway_length_ft INT NOT NULL,
    passenger_demand_score INT DEFAULT 50
);

-- 飛機機型規格表
CREATE TABLE aircraft_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    max_seats_density INT NOT NULL,
    range_km INT NOT NULL,
    cruise_speed_kmh INT NOT NULL,
    fuel_burn_base_kg_h INT NOT NULL
);

-- 航空公司表
CREATE TABLE airlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(3) UNIQUE NOT NULL,
    cash_balance DECIMAL(15, 2) DEFAULT 10000000.00
);

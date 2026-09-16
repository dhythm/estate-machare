-- Listings become properties: zoning, layout, area, build year and walking
-- distance replace the machinery attributes, and rent is charged per month.
-- The machinery rows carry no meaning as properties, so they are dropped and
-- the sample data is loaded again on the next start.

delete from listings;

alter table listings
  drop column maker,
  drop column year,
  drop column hours,
  drop column condition,
  add column zoning text not null,
  add column layout text,
  add column floor_area double precision not null,
  add column built_year integer,
  add column nearest_station text not null,
  add column walk_minutes integer not null,
  add column deposit_months integer,
  add column key_money_months integer,
  add column lease_type text;

alter table listings rename column rent_per_day to rent_per_month;
alter table listings rename column rent_to_own to purchase_option;
alter table listings
  rename column rent_to_own_credit_rate to purchase_option_credit_rate;
alter table listings
  rename column rent_to_own_credit_cap to purchase_option_credit_cap;

create index listings_layout_idx on listings (layout);

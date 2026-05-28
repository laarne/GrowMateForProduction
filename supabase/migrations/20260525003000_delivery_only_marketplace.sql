alter table public.listings
  alter column delivery_option set default 'Delivery';

update public.listings
set delivery_option = 'Delivery'
where delivery_option is distinct from 'Delivery';

update public.orders
set meetup_or_delivery = 'Delivery'
where meetup_or_delivery is distinct from 'Delivery';

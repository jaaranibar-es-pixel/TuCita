import { Salon, ServiceCategory } from '../types';

import heroBannerImg from '../assets/images/hero_tucita_banner_1790698999405.jpg';
import salonAuraImg from '../assets/images/salon_aura_interior_1790699015894.jpg';
import salonChinoImg from '../assets/images/salon_chino_interior_1790699029817.jpg';
import salonNairimImg from '../assets/images/salon_nairim_interior_1790699043217.jpg';
import salonMarImg from '../assets/images/salon_mar_interior_1790699056865.jpg';

import thumbHair from '../assets/images/service_hair_style_1790699070184.jpg';
import thumbNails from '../assets/images/service_nails_art_1790699084180.jpg';
import thumbMakeup from '../assets/images/service_makeup_glam_1790699095061.jpg';
import thumbFacial from '../assets/images/service_facial_spa_1790699110404.jpg';

import galleryHairStyling from '../assets/images/gallery_hair_styling_1790707021626.jpg';
import galleryCustomerCare from '../assets/images/gallery_customer_care_1790707036146.jpg';
import galleryPedicureSpa from '../assets/images/gallery_pedicure_spa_1790707047420.jpg';

export {
  heroBannerImg,
  salonAuraImg,
  thumbHair,
  thumbNails,
  thumbMakeup,
  thumbFacial,
  galleryHairStyling,
  galleryCustomerCare,
  galleryPedicureSpa,
};

export const MOCK_SALONS: Salon[] = [];

export const CATEGORIES_LIST = [
  { id: 'corte', name: 'Corte de cabello', iconType: 'scissors' },
  { id: 'peinados', name: 'Peinados', iconType: 'hairdryer' },
  { id: 'unas', name: 'Uñas', iconType: 'nails' },
  { id: 'tratamientos', name: 'Tratamientos', iconType: 'lotus' },
  { id: 'maquillaje', name: 'Maquillaje', iconType: 'makeup' },
  { id: 'barberia', name: 'Barbería', iconType: 'barber' },
  { id: 'cejas-pestanas', name: 'Cejas y pestañas', iconType: 'eyes' },
  { id: 'faciales', name: 'Faciales', iconType: 'facials' },
  { id: 'mas-servicios', name: 'Más servicios', iconType: 'more' },
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Cabello',
  'Uñas',
  'Maquillaje',
  'Barbería',
  'Tratamientos',
  'Cejas y pestañas',
  'Faciales',
  'Otros',
];

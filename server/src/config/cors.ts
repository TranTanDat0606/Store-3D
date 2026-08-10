import { config } from './index';

export const corsOptions = {
  origin: config.env === 'production' ? config.clientUrl : true,
  credentials: true,
  optionsSuccessStatus: 200,
};

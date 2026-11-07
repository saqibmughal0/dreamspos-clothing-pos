import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducer';
import themeSettingSlice from './themeSettingSlice';
const store = configureStore({
  reducer: {
    rootReducer: rootReducer,
    themeSetting: themeSettingSlice,
  },
});

export default store;

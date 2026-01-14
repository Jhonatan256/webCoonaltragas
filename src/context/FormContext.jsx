import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import useAuth from './useAuth';

const STORAGE_KEY_PREFIX = 'actualizacion_form_data_v1';
const LEGACY_STORAGE_KEY = 'actualizacion_form_data_v1';

const getStorageKey = (ident) => `${STORAGE_KEY_PREFIX}:${ident || 'anon'}`;

const initialFormData = {
  tipoIdentificacion: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  fechaNacimiento: null, // Date
  fechaExpedicion: null, // Date
  fechaInicioIngreso: null, // Date
  genero: '',
  estadoCivil: '',
  nivelEducativo: '',
  educacionSolidaria: '',
  interesCarrera: '',
  emprendimientoActual: '',
  emprendimientoTipo: '',
  temasEducativos: [],
  temasEducativosOtro: '',
  conveniosConocidos: [],
  actualizacionFacil: '',
  actualizacionFacilPorque: '',
  conoceAccesoConvenios: '',
  conoceClubTocaima: '',
  funcionarioPublico: '',
  administraRecursosPublicos: '',
  familiaresPoderPublico: '',
  reconocimientoPublico: '',
  operaMonedaExtranjera: '',
  // Operaciones con activos o monedas virtuales
  operaActivosVirtuales: '',
  activosVirtualesCuales: '',
  tipoOperacion: [],
  tipoOperacionOtra: '',
  ciudadOperacion: '',
  paisOperacion: '',
  poseeCuentasExterior: '',
  cuentaExteriorMoneda: '',
  cuentaExteriorBanco: '',
  cuentaExteriorCuenta: '',
  cuentaExteriorCiudad: '',
  cuentaExteriorPais: '',
  // Número de cuotas del aporte FONVIDA
  numCuotasFonvida: '',
  deseaAhorroAdicional: '',
  ahorroAdicionalMensual: '',
  // Referencia personal/familiar
  tipoReferencia: '',
  referenciaNombreApellidos: '',
  referenciaCelular: '',
  // Beneficiarios (tabla dinámica)
  beneficiarios: [],
  personasDependientes: '',
  rangosEdadDependientes: [],
  tiposVivienda: '',
  condicionVivienda: '',
  direccionResidencia: '',
  barrio: '',
  telefonoFijo: '',
  celular: '',
  ciudadNacimiento: '',
  ciudadResidencia: '',
  municipioExpedicion: '',
  email: '',
  celularContacto: '',
  empresaPatronal: '',
  cargo: '',
  transportePersonal: [],
  placa: '',
  tipoContrato: '',
  salarioMensual: '',
  otrosIngresos: '',
  descripcionOtrosIngresos: '',
  totalActivos: '',
  totalPasivos: '',
  egresos: '',
  origenOtrosIngresos: '',
  gruposProteccionEspecial: [],
  grupoProteccionEspecialOtro: ''
};

const FormContext = createContext();

function reviveData(raw) {
  if (!raw) return initialFormData;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.fechaNacimiento) {
      parsed.fechaNacimiento = new Date(parsed.fechaNacimiento);
      if (isNaN(parsed.fechaNacimiento.getTime())) parsed.fechaNacimiento = null;
    }
    if (parsed.fechaExpedicion) {
      parsed.fechaExpedicion = new Date(parsed.fechaExpedicion);
      if (isNaN(parsed.fechaExpedicion.getTime())) parsed.fechaExpedicion = null;
    }
    if (parsed.fechaInicioIngreso) {
      parsed.fechaInicioIngreso = new Date(parsed.fechaInicioIngreso);
      if (isNaN(parsed.fechaInicioIngreso.getTime())) parsed.fechaInicioIngreso = null;
    }
    return { ...initialFormData, ...parsed };
  } catch (e) {
    console.warn('No se pudo parsear datos guardados, usando iniciales', e);
    return initialFormData;
  }
}

export const FormProvider = ({ children }) => {
  const { identificacion } = useAuth();
  const initialKey = getStorageKey(identificacion);
  const prevKeyRef = useRef(initialKey);
  const prevIdentRef = useRef(identificacion);
  const [storageKey, setStorageKey] = useState(initialKey);
  const [formData, setFormData] = useState(() => reviveData(localStorage.getItem(initialKey)));
  const [lastSaved, setLastSaved] = useState(null);

  // Migración: eliminar clave genérica si existe
  useEffect(() => {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, []);

  // Cuando cambia la identificación, actualizar la storageKey y limpiar datos en memoria
  useEffect(() => {
    const newKey = getStorageKey(identificacion);
    const prevKey = prevKeyRef.current;
    const prevIdent = prevIdentRef.current;
    const newIdent = identificacion;
    // Solo eliminar datos del usuario anterior si ambos IDs son no nulos y diferentes
    if (prevKey && prevKey !== newKey && prevIdent && newIdent && prevIdent !== newIdent) {
      localStorage.removeItem(prevKey);
    }
    setStorageKey(newKey);
    // Cargar datos propios del nuevo usuario (o limpiar si no hay)
    setFormData(reviveData(localStorage.getItem(newKey)));
    setLastSaved(null);
    // Limpieza de clave legada genérica
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    prevKeyRef.current = newKey;
    prevIdentRef.current = identificacion;
  }, [identificacion]);

  // Guardado debounced simple
  useEffect(() => {
    try {
      const toStore = {
        ...formData,
        fechaNacimiento: formData.fechaNacimiento ? formData.fechaNacimiento.toISOString() : null,
        fechaExpedicion: formData.fechaExpedicion ? formData.fechaExpedicion.toISOString() : null,
        fechaInicioIngreso: formData.fechaInicioIngreso ? formData.fechaInicioIngreso.toISOString() : null
      };
      localStorage.setItem(storageKey, JSON.stringify(toStore));
      setLastSaved(Date.now());
    } catch (e) {
      console.error('Error guardando formulario en localStorage', e);
    }
  }, [formData, storageKey]);

  const updateField = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const bulkUpdate = useCallback((patch) => {
    setFormData(prev => ({ ...prev, ...patch }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const value = useMemo(() => ({ formData, updateField, bulkUpdate, resetForm, lastSaved }), [formData, updateField, bulkUpdate, resetForm, lastSaved]);
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

FormProvider.propTypes = {
  children: PropTypes.node
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFormData = () => {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useFormData debe usarse dentro de FormProvider');
  return ctx;
};

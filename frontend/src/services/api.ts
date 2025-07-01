import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Interfaces
export type Article = {
  titulo: string;
  autor: string;
  doi: string;
};

export type ArticleWithInstitution = {
  titulo: string;
  doi: string;
  autor: string;
  institucion: string;
};

export type ArticleWithKeywords = {
  titulo: string;
  doi: string;
  keywords: string;
};

export type ArticleDetail = {
  uri: string;
  titulo: string;
  autor: string;
  resumen: string;
  url: string;
};

export type Section = {
  seccion: string;
  cantidad: number;
};

export type TopAuthor = {
  autor: string;
  publicaciones: number;
};

// Endpoints
export const getArticulos = async (autor?: string): Promise<Article[]> => {
  const res = await axios.get(`${API_BASE}/articulos`, {
    params: autor ? { autor } : {},
  });
  return res.data;
};

export const getArticulosPorInstitucion = async (inst: string): Promise<ArticleWithInstitution[]> => {
  const res = await axios.get(`${API_BASE}/articulos_institucion`, {
    params: { inst },
  });
  return res.data;
};

export const getArticulosRelacionados = async (doi: string): Promise<Article[]> => {
  const res = await axios.get(`${API_BASE}/relacionados`, {
    params: { doi },
  });
  return res.data;
};

export const getSeccionesMasActivas = async (): Promise<Section[]> => {
  const res = await axios.get(`${API_BASE}/secciones_mas_activas`);
  return res.data;
};

export const getAutoresTop = async (): Promise<TopAuthor[]> => {
  const res = await axios.get(`${API_BASE}/autores_top`);
  return res.data;
};

export const getAutores = async (): Promise<TopAuthor[]> => {
  const res = await axios.get(`${API_BASE}/autores`);
  return res.data;
};

export const getSecciones = async (): Promise<string[]> => {
  const res = await axios.get(`${API_BASE}/secciones`);
  return res.data;
};

export const getArticulosPorKeywords = async (kw: string): Promise<ArticleWithKeywords[]> => {
  const res = await axios.get(`${API_BASE}/articulos_keywords`, {
    params: { kw },
  });
  return res.data;
};

export const getArticuloPorDOI = async (doi: string) => {
  const res = await axios.get(`${API_BASE}/articulo/`, {
    params: { doi },
  });
  return res.data;
};
export const getArticulosPorKeyword = async (kw: string) => {
  const res = await axios.get(`${API_BASE}/articulos_keywords`, {
    params: { kw },
  });
  return res.data;
};

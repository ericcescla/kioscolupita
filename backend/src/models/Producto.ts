import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Producto extends Model<InferAttributes<Producto>, InferCreationAttributes<Producto>> {
  declare id: CreationOptional<number>;
  declare nombre: string;
  declare categoria: string;
  declare precio: number;
  declare activo: CreationOptional<boolean>;
}

Producto.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
  categoria: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Otros', validate: { notEmpty: true } },
  precio: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0.01 } },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { sequelize, tableName: 'productos', timestamps: true, underscored: true, indexes: [{ fields: ['categoria'] }, { fields: ['activo'] }] });

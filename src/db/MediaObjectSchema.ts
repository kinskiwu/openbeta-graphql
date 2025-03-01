import mongoose from 'mongoose'
import { MediaObject, EntityTag } from './MediaObjectTypes.js'
import { PointSchema } from './ClimbSchema.js'
import { MUUID } from 'uuid-mongodb'

const { Schema } = mongoose

const UUID_TYPE = {
  type: 'object', value: { type: 'Buffer' }
}

const muuidTransform = (v: MUUID): string => {
  return v.toUUID().toString()
}

const EntitySchema = new Schema<EntityTag>({
  targetId: { ...UUID_TYPE, index: true, transform: muuidTransform },
  climbName: { type: Schema.Types.String },
  areaName: { type: Schema.Types.String, required: true },
  type: { type: Schema.Types.Number, required: true },
  ancestors: { type: Schema.Types.String, required: true, index: true },
  lnglat: {
    type: PointSchema,
    index: '2dsphere',
    required: false
  },
  topoData: { type: Schema.Types.Mixed }
}, { _id: true, toObject: { versionKey: false } })

const schema = new Schema<MediaObject>({
  userUuid: { ...UUID_TYPE, index: true, transform: (v: any) => v.toUUID().toString() },
  mediaUrl: { type: Schema.Types.String, unique: true, index: true },
  width: { type: Schema.Types.Number, required: true },
  height: { type: Schema.Types.Number, required: true },
  size: { type: Schema.Types.Number, required: true },
  format: { type: Schema.Types.String, required: true },
  entityTags: [EntitySchema]
}, { _id: true, timestamps: true, toJSON: { versionKey: false }, toObject: { versionKey: false } })

/**
 * Additional indices
 */
schema.index({
  /**
   * For filtering media objects with/without tags
   */
  entityTags: 1,
  /**
   * For sorting media objects by insertion order
   */
  createdAt: -1 // ascending, more recent first
})

/**
 * For checking media ownership
 */
schema.index({
  _id: 1,
  userUuid: 1
})

/**
 * For removeEntityTag update query
 */
schema.index({
  _id: 1,
  'entityTag._id': 1
})

/**
 * For addEntityTag() update query to check whether an existing entity already exists.
 */
schema.index({
  _id: 1,
  'entityTag.targetId': 1
})

/**
 * Get media object model
 * @returns MediaObjectType
 */
export const getMediaObjectModel = (): mongoose.Model<MediaObject> => {
  return mongoose.model('media_objects', schema)
}

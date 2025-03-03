import { web3 } from '@project-serum/anchor'
import { shadowDriveDomain } from '../../utils/constants'
import { PostChain, UserChain } from '../../models'
import { Post, PostFileData, PostUser, UserFileData } from '../../types'
import { getMediaDataWithUrl, getPostFileData } from './helpers'
import { getTextFromFile } from '../../utils/helpers'
import { UserNotFoundError } from '../../utils/errors'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { getUserFileData } from '../user/helpers'

/**
 * @category Post
 * @param publicKey - the PublicKey of the post
 */
export default async function getPost(publicKey: web3.PublicKey): Promise<Post> {
  try {
    // Fetch the post from the anchor program.
    const post = await this.anchorProgram.account.post.fetch(publicKey)
    const postChain = new PostChain(publicKey, post)

    // Fetch the user profile.
    const onChainProfiles = await this.anchorProgram.account.userProfile.all([
      {
        memcmp: {
          offset:
            8 + // Discriminator
            8 + // Timestamp
            32, // user
          bytes: bs58.encode(Uint8Array.from([postChain.userId])),
        },
      },
    ])
    if (onChainProfiles.length === 0) throw new UserNotFoundError()

    const profile = onChainProfiles[0]
    const userChain = new UserChain(profile.publicKey, profile.account)

    const postFileData: PostFileData = await getPostFileData(publicKey, userChain.shdw)

    if (postFileData.text != null) {
      postFileData.text = await getTextFromFile(
        `${shadowDriveDomain}${userChain.shdw.toString()}/${postFileData.text}`,
      )
    }

    // Get user profile json file from the shadow drive.
    const userProfileJson: UserFileData = await getUserFileData(userChain.shdw)

    return Promise.resolve({
      timestamp: postChain.timestamp,
      publicKey: publicKey,
      status: postChain.status,
      programId: postFileData.programId,
      userId: Number(postFileData.userId),
      groupId: Number(postFileData.groupId),
      text: postFileData.text,
      media: getMediaDataWithUrl(postFileData.media, userChain.shdw),
      license: postFileData.license,
      user: {
        publicKey: userChain.user,
        nickname: userProfileJson.nickname,
        avatar:
          userProfileJson.avatar != null
            ? `${shadowDriveDomain}${userChain.shdw.toString()}/${userProfileJson.avatar.file}`
            : null,
      } as PostUser,
    } as Post)
  } catch (error) {
    return Promise.reject(error)
  }
}

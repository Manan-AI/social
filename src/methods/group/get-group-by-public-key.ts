import { shadowDriveDomain } from '../../utils/constants'
import { GroupChain } from '../../models'
import { Group, GroupFileData } from '../../types'
import { getGroupFileData } from './helpers'
import { web3 } from '@project-serum/anchor'

/**
 * @category Group
 * @param web3.PublicKey - the public key of the group
 */
export default async function getGroupByPublicKey(publicKey: web3.PublicKey): Promise<Group> {
  try {
    // Fetch the group by public key.
    const groupProfile = await this.anchorProgram.account.groupProfile.fetch(publicKey)
    const groupChain = new GroupChain(publicKey, groupProfile)

    const groupFileData: GroupFileData = await getGroupFileData(groupChain.shdw)

    return Promise.resolve({
      timestamp: groupChain.timestamp,
      publicKey: publicKey,
      groupId: groupChain.groupId,
      status: groupChain.status,
      shdw: groupChain.shdw,
      name: groupFileData.name,
      bio: groupFileData.bio,
      avatar:
        groupFileData.avatar != null
          ? `${shadowDriveDomain}${groupChain.shdw.toString()}/${groupFileData.avatar.file}`
          : null,
      banner: null,
      license: groupFileData.license,
    } as Group)
  } catch (error) {
    return Promise.reject(error)
  }
}

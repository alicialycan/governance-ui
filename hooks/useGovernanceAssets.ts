import { GovernanceAccountType } from '@solana/spl-governance'
import { AccountType, AssetAccount } from '@utils/uiTypes/assets'
import { Instructions } from '@utils/uiTypes/proposalCreationTypes'
import useGovernanceAssetsStore from 'stores/useGovernanceAssetsStore'
import useRealm from './useRealm'
import { vsrPluginsPks } from './useVotingPlugins'

export default function useGovernanceAssets() {
  const { ownVoterWeight, realm, symbol, governances, config } = useRealm()
  const governedTokenAccounts: AssetAccount[] = useGovernanceAssetsStore(
    (s) => s.governedTokenAccounts
  )
  const assetAccounts = useGovernanceAssetsStore((s) => s.assetAccounts)

  const currentPluginPk = config?.account.communityVoterWeightAddin
  const governancesArray = useGovernanceAssetsStore((s) => s.governancesArray)

  const getGovernancesByAccountType = (type: GovernanceAccountType) => {
    const governancesFiltered = governancesArray.filter(
      (gov) => gov.account?.accountType === type
    )
    return governancesFiltered
  }

  const getGovernancesByAccountTypes = (types: GovernanceAccountType[]) => {
    const governancesFiltered = governancesArray.filter((gov) =>
      types.some((t) => gov.account?.accountType === t)
    )
    return governancesFiltered
  }

  function canUseGovernanceForInstruction(types: GovernanceAccountType[]) {
    return (
      realm &&
      getGovernancesByAccountTypes(types).some((govAcc) =>
        ownVoterWeight.canCreateProposal(govAcc.account.config)
      )
    )
  }
  const canMintRealmCommunityToken = () => {
    const governances = getGovernancesByAccountTypes([
      GovernanceAccountType.MintGovernanceV1,
      GovernanceAccountType.MintGovernanceV2,
    ])
    return !!governances.find((govAcc) =>
      realm?.account.communityMint.equals(govAcc.account.governedAccount)
    )
  }
  const canMintRealmCouncilToken = () => {
    const governances = getGovernancesByAccountTypes([
      GovernanceAccountType.MintGovernanceV1,
      GovernanceAccountType.MintGovernanceV2,
    ])

    return !!governances.find(
      (x) =>
        x.account.governedAccount.toBase58() ==
        realm?.account.config.councilMint?.toBase58()
    )
  }
  // TODO: Check governedAccounts from all governances plus search for token accounts owned by governances
  const canUseTransferInstruction = canUseGovernanceForInstruction([
    GovernanceAccountType.TokenGovernanceV1,
    GovernanceAccountType.TokenGovernanceV2,
  ])

  const canUseProgramUpgradeInstruction = canUseGovernanceForInstruction([
    GovernanceAccountType.ProgramGovernanceV1,
    GovernanceAccountType.ProgramGovernanceV2,
  ])

  const canUseMintInstruction = canUseGovernanceForInstruction([
    GovernanceAccountType.MintGovernanceV1,
    GovernanceAccountType.MintGovernanceV2,
  ])

  const canUseAnyInstruction =
    realm &&
    governancesArray.some((gov) =>
      ownVoterWeight.canCreateProposal(gov.account.config)
    )

  const realmAuth =
    realm &&
    governancesArray.find(
      (x) => x.pubkey.toBase58() === realm.account.authority?.toBase58()
    )
  const canUseAuthorityInstruction =
    realmAuth && ownVoterWeight.canCreateProposal(realmAuth?.account.config)

  const getAvailableInstructions = () => {
    return availableInstructions.filter((itx) => itx.isVisible)
  }
  const governedTokenAccountsWithoutNfts = governedTokenAccounts.filter(
    (x) => x.type !== AccountType.NFT
  )
  const nftsGovernedTokenAccounts = governedTokenAccounts.filter(
    (govTokenAcc) =>
      govTokenAcc.type === AccountType.NFT ||
      govTokenAcc.type === AccountType.SOL
  )
  const canUseTokenTransferInstruction = governedTokenAccountsWithoutNfts.some(
    (acc) => {
      const governance = governancesArray.find(
        (x) => acc.governance.pubkey.toBase58() === x.pubkey.toBase58()
      )
      return (
        governance &&
        ownVoterWeight.canCreateProposal(governance?.account?.config)
      )
    }
  )
  const availableInstructions = [
    {
      id: Instructions.Transfer,
      name: 'Transfer Tokens',
      isVisible: canUseTokenTransferInstruction,
    },
    {
      id: Instructions.Grant,
      name: 'Grant',
      isVisible:
        canUseTokenTransferInstruction &&
        currentPluginPk &&
        vsrPluginsPks.includes(currentPluginPk.toBase58()),
    },
    {
      id: Instructions.Clawback,
      name: 'Clawback',
      isVisible:
        canUseTokenTransferInstruction &&
        currentPluginPk &&
        vsrPluginsPks.includes(currentPluginPk.toBase58()),
    },
    {
      id: Instructions.MangoChangePerpMarket,
      name: 'Mango: Change Perp Market',
      isVisible: canUseProgramUpgradeInstruction && symbol === 'MNGO',
    },
    {
      id: Instructions.MangoChangeSpotMarket,
      name: 'Mango: Change Spot Market',
      isVisible: canUseProgramUpgradeInstruction && symbol === 'MNGO',
    },
    {
      id: Instructions.MangoChangeReferralFeeParams,
      name: 'Mango: Change Referral Fee Params',
      isVisible: canUseProgramUpgradeInstruction && symbol === 'MNGO',
    },
    {
      id: Instructions.MangoChangeMaxAccounts,
      name: 'Mango: Change Max Accounts',
      isVisible: canUseProgramUpgradeInstruction && symbol === 'MNGO',
    },
    {
      id: Instructions.MangoAddOracle,
      name: 'Mango: Add Oracle',
      isVisible: canUseProgramUpgradeInstruction && symbol === 'MNGO',
    },
    {
      id: Instructions.MangoAddSpotMarket,
      name: 'Mango: Add Spot Market',
      isVisible: canUseProgramUpgradeInstruction && symbol === 'MNGO',
    },
    {
      id: Instructions.MangoCreatePerpMarket,
      name: 'Mango: Create Perp Market',
      isVisible: canUseProgramUpgradeInstruction && symbol === 'MNGO',
    },
    {
      id: Instructions.Mint,
      name: 'Mint Tokens',
      isVisible: canUseMintInstruction,
    },
    {
      id: Instructions.CreateAssociatedTokenAccount,
      name: 'Create Associated Token Account',
      isVisible: canUseAnyInstruction,
    },
    {
      id: Instructions.Base64,
      name: 'Execute Custom Instruction',
      isVisible: canUseAnyInstruction,
    },
    {
      id: Instructions.DepositIntoVolt,
      name: 'Friktion: Deposit into Volt',
      isVisible: canUseAnyInstruction,
    },
    {
      id: Instructions.WithdrawFromVolt,
      name: 'Friktion: Withdraw from Volt',
      isVisible: canUseAnyInstruction,
    },
    {
      id: Instructions.CreateSolendObligationAccount,
      name: 'Solend: Create Obligation Account',
      isVisible: canUseAnyInstruction,
    },
    {
      id: Instructions.InitSolendObligationAccount,
      name: 'Solend: Init Obligation Account',
      isVisible: canUseAnyInstruction,
    },
    {
      id: Instructions.DepositReserveLiquidityAndObligationCollateral,
      name: 'Solend: Deposit Funds',
      isVisible: canUseAnyInstruction,
    },
    {
      id: Instructions.RefreshSolendReserve,
      name: 'Solend: Refresh Reserve',
      isVisible: canUseAnyInstruction,
    },
    {
      id: Instructions.RefreshSolendObligation,
      name: 'Solend: Refresh Obligation',
      isVisible: canUseAnyInstruction,
    },
    {
      id: Instructions.WithdrawObligationCollateralAndRedeemReserveLiquidity,
      name: 'Solend: Withdraw Funds',
      isVisible: canUseAnyInstruction,
    },
    {
      id: Instructions.ProgramUpgrade,
      name: 'Upgrade Program',
      isVisible: canUseProgramUpgradeInstruction,
    },
    {
      id: Instructions.CreateNftPluginRegistrar,
      name: 'Create NFT plugin registrar',
      isVisible: canUseAuthorityInstruction,
    },
    {
      id: Instructions.ConfigureNftPluginCollection,
      name: 'Configure NFT plugin collection',
      isVisible: canUseAuthorityInstruction,
    },
    {
      id: Instructions.RealmConfig,
      name: 'Realm config',
      isVisible: canUseAuthorityInstruction,
    },
    {
      id: Instructions.CreateNftPluginMaxVoterWeight,
      name: 'Create NFT plugin max voter weight',
      isVisible: canUseAuthorityInstruction,
    },
    {
      id: Instructions.CloseTokenAccount,
      name: 'Close token account',
      isVisible: canUseTransferInstruction,
    },
    {
      id: Instructions.None,
      name: 'None',
      isVisible:
        realm &&
        Object.values(governances).some((g) =>
          ownVoterWeight.canCreateProposal(g.account.config)
        ),
    },
  ]

  return {
    governancesArray,
    getGovernancesByAccountType,
    getGovernancesByAccountTypes,
    availableInstructions,
    getAvailableInstructions,
    governedTokenAccounts,
    canUseTransferInstruction,
    canUseMintInstruction,
    canMintRealmCommunityToken,
    canMintRealmCouncilToken,
    canUseProgramUpgradeInstruction,
    governedTokenAccountsWithoutNfts,
    nftsGovernedTokenAccounts,
    canUseAuthorityInstruction,
    assetAccounts,
  }
}

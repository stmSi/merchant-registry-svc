import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import {
  Box,
  HStack,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MerchantRegistrationStatus } from 'shared-lib'

import type { MerchantInfo } from '@/types/merchants'
import {
  type DraftApplications,
  draftApplicationsSchema,
} from '@/lib/validations/draftApplications'
import { getMerchants } from '@/api'
import {
  REGISTRATION_STATUS_COLORS,
  type RegistrationStatus,
} from '@/constants/registrationStatus'
import { transformIntoTableData } from '@/utils'
import { CustomButton, DataTable, MerchantInformationModal } from '@/components/ui'
import { FormInput } from '@/components/form'

const DraftApplications = () => {
  const navigate = useNavigate()

  const [data, setData] = useState<MerchantInfo[]>([])
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | null>(null)

  const { isOpen, onOpen, onClose } = useDisclosure()

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<MerchantInfo>()

    return [
      columnHelper.accessor('no', {
        cell: info => info.getValue(),
        header: 'No',
      }),
      columnHelper.accessor('dbaName', {
        cell: info => info.getValue(),
        header: 'Doing Business As Name',
      }),
      columnHelper.accessor('registeredName', {
        cell: info => info.getValue(),
        header: 'Registered Name',
      }),
      columnHelper.accessor('payintoAccount', {
        cell: info => info.getValue(),
        header: 'Payinto Account',
      }),
      columnHelper.accessor('merchantType', {
        cell: info => info.getValue(),
        header: 'Merchant Type',
      }),
      columnHelper.accessor('state', {
        cell: info => info.getValue(),
        header: 'State',
      }),
      columnHelper.accessor('countrySubdivision', {
        cell: info => info.getValue(),
        header: 'Country Subdivision',
      }),
      columnHelper.accessor('counterDescription', {
        cell: info => info.getValue(),
        header: 'Counter Description',
      }),
      columnHelper.accessor('registeredDfspName', {
        cell: info => info.getValue(),
        header: 'Registered DFSP Name',
      }),
      columnHelper.accessor('registrationStatus', {
        cell: info => (
          <HStack justify='center' spacing='1.5'>
            <Box
              as='span'
              w='2'
              h='2'
              borderRadius='full'
              bg={REGISTRATION_STATUS_COLORS[info.getValue() as RegistrationStatus]}
            />

            <Text>{info.getValue()}</Text>
          </HStack>
        ),
        header: 'Registration Status',
      }),
      columnHelper.display({
        id: 'view-details',
        cell: ({ row }) => (
          <CustomButton
            mt={{ base: '2', xl: '0' }}
            mr={{ base: '-2', xl: '3' }}
            onClick={() => {
              setSelectedMerchantId(row.original.no)
              onOpen()
            }}
          >
            View Details
          </CustomButton>
        ),
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'proceed',
        cell: ({ row }) => (
          <CustomButton
            mt={{ base: '2', xl: '0' }}
            mr={{ base: '-2', xl: '3' }}
            onClick={() => {
              sessionStorage.setItem('merchantId', row.original.no.toString())
              navigate('/registry/registry-form')
            }}
          >
            Proceed
          </CustomButton>
        ),
        enableSorting: false,
      }),
    ]
  }, [navigate, onOpen])

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<DraftApplications>({
    resolver: zodResolver(draftApplicationsSchema),
  })

  const getDrafts = async (values?: DraftApplications) => {
    const params = values
      ? { ...values, registrationStatus: MerchantRegistrationStatus.DRAFT }
      : { registrationStatus: MerchantRegistrationStatus.DRAFT }
    const drafts = await getMerchants(params)

    if (drafts) {
      const transformedData = drafts.map(transformIntoTableData)
      setData(transformedData)
    }
  }

  useEffect(() => {
    getDrafts()
  }, [])

  const onSubmit = (values: DraftApplications) => {
    getDrafts(values)
  }

  return (
    <Stack h='full'>
      <Heading size='md' mb='10'>
        Merchant Acquiring System &gt; Draft Applications
      </Heading>

      <Stack as='form' spacing='8' onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid
          templateColumns={{
            base: 'repeat(1, 1fr)',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)',
          }}
          columnGap='8'
          rowGap={{ base: '4', sm: '6' }}
          justifyItems='center'
        >
          <FormInput
            name='addedBy'
            register={register}
            errors={errors}
            label='Added By'
            placeholder='Enter the one who is added by'
          />

          <FormInput
            name='approvedBy'
            register={register}
            errors={errors}
            label='Approved By'
            placeholder='Enter the one who is approved by'
          />

          <FormInput
            name='addedTime'
            register={register}
            errors={errors}
            label='Added Time'
            placeholder='Choose added date and time'
            inputProps={{ type: 'date' }}
          />

          <FormInput
            name='updatedTime'
            register={register}
            errors={errors}
            label='Updated Time'
            placeholder='Choose updated date and time'
            inputProps={{ type: 'date' }}
          />

          <FormInput
            name='dbaName'
            register={register}
            errors={errors}
            label='DBA Name'
            placeholder='Enter DBA name'
          />

          <FormInput
            name='merchantId'
            register={register}
            errors={errors}
            label='Merchant ID'
            placeholder='Enter Merchant ID'
          />

          <FormInput
            name='payintoId'
            register={register}
            errors={errors}
            label='Payinto ID'
            placeholder='Enter Payinto ID'
          />
        </SimpleGrid>

        <Box alignSelf='end'>
          <CustomButton
            colorVariant='accent-outline'
            mr='4'
            onClick={() => {
              reset()
              getDrafts()
            }}
          >
            Clear Filter
          </CustomButton>

          <CustomButton type='submit' px='6'>
            Search
          </CustomButton>
        </Box>
      </Stack>

      {selectedMerchantId && (
        <MerchantInformationModal
          isOpen={isOpen}
          onClose={onClose}
          selectedMerchantId={selectedMerchantId}
        />
      )}

      <Box
        bg='primaryBackground'
        mx={{ base: '-4', sm: '-6', lg: '-8' }}
        mt='5'
        pt='6'
        px='4'
        pb='14'
        flexGrow='1'
        mb='-14'
      >
        <DataTable
          data={data}
          columns={columns}
          breakpoint='xl'
          alwaysVisibleColumns={[0]}
        />
      </Box>
    </Stack>
  )
}

export default DraftApplications
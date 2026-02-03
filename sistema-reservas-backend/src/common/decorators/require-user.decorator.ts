import { SetMetadata } from '@nestjs/common';

export const REQUIRE_USER_KEY = 'requireUser';

export const RequireUser = () => SetMetadata(REQUIRE_USER_KEY, true);
